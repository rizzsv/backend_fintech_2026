import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auditService } from "../../../src/modules/audit/services/audit.services";
import { fraudService } from "../../../src/modules/transaction/services/fraud.service";
import { transactionRepository } from "../../../src/modules/transaction/repositories/transaction.repository";
import { FRAUD } from "../../../src/modules/transaction/constants/transaction.constants";

vi.mock("../../../src/modules/transaction/repositories/transaction.repository", () => ({
    transactionRepository: {
        countTransferLastMinute: vi.fn(),
    },
}));

vi.mock("../../../src/modules/audit/services/audit.services", () => ({
    auditService: {
        log: vi.fn(),
    },
}));

const sender = { id: "wallet-sender", userId: "user-1" } as any;
const receiver = { id: "wallet-receiver", userId: "user-2" } as any;

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(transactionRepository.countTransferLastMinute).mockResolvedValue(0);
});

describe("fraudService.validateTransfer", () => {
    it("does not record a fraud audit entry for a legitimate transfer", async () => {
        await expect(
            fraudService.validateTransfer(sender, receiver, new Prisma.Decimal(100_000))
        ).resolves.toBeUndefined();

        // A FRAUD_DETECTED entry on every successful transfer would make the
        // audit trail useless as evidence.
        expect(auditService.log).not.toHaveBeenCalled();
    });

    it("rejects an amount over the single-transfer cap", async () => {
        await expect(
            fraudService.validateTransfer(
                sender,
                receiver,
                new Prisma.Decimal(FRAUD.MAX_SINGGLE_TRANSFER + 1)
            )
        ).rejects.toThrow(/exceeds the maximum limit/);
    });

    it("rejects a self-transfer", async () => {
        await expect(
            fraudService.validateTransfer(sender, sender, new Prisma.Decimal(1_000))
        ).rejects.toThrow(/Self-transfer/);
    });

    it("records a fraud audit entry when the velocity limit is hit", async () => {
        vi.mocked(transactionRepository.countTransferLastMinute).mockResolvedValue(
            FRAUD.MAX_TRANSFER_PER_MINUTE
        );

        await expect(
            fraudService.validateTransfer(sender, receiver, new Prisma.Decimal(1_000))
        ).rejects.toThrow(/Too many transfers/);

        expect(auditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: sender.userId,
                action: "FRAUD_DETECTED",
                status: "FAILED",
                metadata: expect.objectContaining({ reason: "VELOCITY_LIMIT" }),
            })
        );
    });
});
