import { Prisma, WithdrawalMethod, withdrawalStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../src/shared/config/database";
import { walletRepository } from "../../../src/modules/wallet/repositories/wallet.repository";
import { withdrawalRepository } from "../../../src/modules/withdrawal/repositories/withdrawal.repository";
import { withdrawalRiskService } from "../../../src/modules/withdrawal/security/withdrawal-risk.service";
import { withdrawalService } from "../../../src/modules/withdrawal/services/withdrawal.service";
import { WITHDRAWAL_CONSTANTS } from "../../../src/modules/withdrawal/constants/withdrawal.constants";

vi.mock("../../../src/shared/config/database", () => ({
    prisma: {
        $transaction: vi.fn(),
    },
}));

vi.mock("../../../src/modules/withdrawal/repositories/withdrawal.repository", () => ({
    withdrawalRepository: {
        findById: vi.fn(),
        findByIdempotencyKey: vi.fn(),
        getDailyTotal: vi.fn(),
        create: vi.fn(),
        updateStatus: vi.fn(),
    },
}));

vi.mock("../../../src/modules/wallet/repositories/wallet.repository", () => ({
    walletRepository: {
        findById: vi.fn(),
        findByUserId: vi.fn(),
        updateBalance: vi.fn(),
    },
}));

vi.mock("../../../src/modules/audit/services/audit.services", () => ({
    auditService: {
        log: vi.fn(),
    },
}));

vi.mock("../../../src/modules/withdrawal/security/withdrawal-risk.service", () => ({
    withdrawalRiskService: {
        check: vi.fn(),
    },
}));

// The queue opens a Redis connection on import, which is not available in unit runs.
vi.mock("../../../src/modules/withdrawal/queue/withdrawal.queue", () => ({
    withdrawalQueue: {
        add: vi.fn(),
    },
}));

// Mock withdrawal execution service for synchronous processing
vi.mock("../../../src/modules/withdrawal/services/withdrawal.execution.service", () => ({
    withdrawalExecutionService: {
        executeWithdrawal: vi.fn().mockResolvedValue({ success: true }),
    },
}));

const AMOUNT = 100_000;

function buildTxStub() {
    return {
        transaction: {
            create: vi.fn().mockResolvedValue({ id: "txn-1" }),
        },
        ledgerEntry: {
            create: vi.fn().mockResolvedValue({ id: "ledger-1" }),
        },
        withdrawal: {
            update: vi.fn(),
        },
    };
}

let tx: ReturnType<typeof buildTxStub>;

beforeEach(() => {
    vi.clearAllMocks();

    tx = buildTxStub();

    vi.mocked(prisma.$transaction).mockImplementation(
        (async (callback: any) => callback(tx)) as any
    );

    vi.mocked(walletRepository.updateBalance).mockResolvedValue({ count: 1 } as any);
    vi.mocked(withdrawalRiskService.check).mockResolvedValue({ risky: false } as any);
});

/**
 * Reads the signed balance delta handed to `walletRepository.updateBalance`.
 */
function balanceDelta() {
    const call = vi.mocked(walletRepository.updateBalance).mock.calls[0];
    return call[3] as Prisma.Decimal;
}

describe("withdrawalService.getConfig", () => {
    it("exposes the backend-authoritative fee and bounds", () => {
        expect(withdrawalService.getConfig()).toEqual({
            fee: WITHDRAWAL_CONSTANTS.FEE,
            minAmount: WITHDRAWAL_CONSTANTS.MIN_AMOUNT,
            maxAmount: WITHDRAWAL_CONSTANTS.MAX_AMOUNT,
            dailyLimit: WITHDRAWAL_CONSTANTS.DAILY_LIMIT,
            methods: [WithdrawalMethod.BANK_TRANSFER, WithdrawalMethod.EWALLET],
        });
    });
});

describe("withdrawalService.createWithdrawal", () => {
    beforeEach(() => {
        vi.mocked(withdrawalRepository.findByIdempotencyKey).mockResolvedValue(null as any);
        vi.mocked(withdrawalRepository.getDailyTotal).mockResolvedValue(
            new Prisma.Decimal(0) as any
        );
        vi.mocked(walletRepository.findByUserId).mockResolvedValue({
            id: "wallet-1",
            balance: new Prisma.Decimal(500_000),
            version: 3,
        } as any);
        vi.mocked(withdrawalRepository.create).mockImplementation((async (data: any) => ({
            id: "wd-1",
            referenceNumber: data.referenceNumber,
            status: data.status,
            amount: data.amount,
            fee: data.fee,
            netAmount: data.netAmount,
        })) as any);
    });

    it("applies the backend fee and debits the gross amount", async () => {
        const result = await withdrawalService.createWithdrawal("user-1", {
            amount: AMOUNT,
            method: WithdrawalMethod.BANK_TRANSFER,
            bankCode: "BCA",
            accountNumber: "1234567890",
            accountName: "Rizq Valeant",
            idempotencyKey: "idem-1",
        });

        // The fee comes from the server, never from the caller.
        expect(result.fee).toBe(WITHDRAWAL_CONSTANTS.FEE);
        expect(result.amount).toBe(AMOUNT);
        expect(result.netAmount).toBe(AMOUNT - WITHDRAWAL_CONSTANTS.FEE);
        expect(result.status).toBe(withdrawalStatus.PENDING);

        // The wallet loses the gross amount; the fee is carved out of it.
        expect(balanceDelta().toString()).toBe(String(-AMOUNT));
    });

    it("rejects an amount under the configured minimum", async () => {
        await expect(
            withdrawalService.createWithdrawal("user-1", {
                amount: WITHDRAWAL_CONSTANTS.MIN_AMOUNT - 1,
                method: WithdrawalMethod.EWALLET,
                idempotencyKey: "idem-2",
            })
        ).rejects.toThrow(/Minimum withdrawal amount/);

        expect(walletRepository.updateBalance).not.toHaveBeenCalled();
    });

    it("rejects an amount over the configured maximum", async () => {
        await expect(
            withdrawalService.createWithdrawal("user-1", {
                amount: WITHDRAWAL_CONSTANTS.MAX_AMOUNT + 1,
                method: WithdrawalMethod.EWALLET,
                idempotencyKey: "idem-3",
            })
        ).rejects.toThrow(/Maximum withdrawal amount/);

        expect(walletRepository.updateBalance).not.toHaveBeenCalled();
    });
});

describe("withdrawalService.cancelWithdrawal", () => {
    const pendingWithdrawal = {
        id: "wd-1",
        userId: "user-1",
        walletId: "wallet-1",
        amount: new Prisma.Decimal(AMOUNT),
        fee: new Prisma.Decimal(WITHDRAWAL_CONSTANTS.FEE),
        netAmount: new Prisma.Decimal(AMOUNT - WITHDRAWAL_CONSTANTS.FEE),
        referenceNumber: "WD20260101ABCDEF12",
        status: withdrawalStatus.PENDING,
    };

    beforeEach(() => {
        vi.mocked(withdrawalRepository.findById).mockResolvedValue(pendingWithdrawal as any);
        vi.mocked(walletRepository.findById).mockResolvedValue({
            id: "wallet-1",
            balance: new Prisma.Decimal(400_000),
            version: 4,
        } as any);
    });

    it("refunds exactly what was debited, never the fee on top", async () => {
        await withdrawalService.cancelWithdrawal("wd-1");

        // Creation debits `amount`, so cancellation must credit `amount`.
        // Crediting `amount + fee` would mint money out of nothing.
        expect(balanceDelta().toString()).toBe(String(AMOUNT));
        expect(balanceDelta().toString()).not.toBe(
            String(AMOUNT + WITHDRAWAL_CONSTANTS.FEE)
        );
    });

    it("writes a ledger credit that matches the refunded amount", async () => {
        await withdrawalService.cancelWithdrawal("wd-1");

        const entry = tx.ledgerEntry.create.mock.calls[0][0].data;

        expect(entry.amount.toString()).toBe(String(AMOUNT));
        // 400_000 opening balance + 100_000 refund.
        expect(entry.balanceAfter.toString()).toBe("500000");
    });

    it("marks the withdrawal cancelled", async () => {
        await withdrawalService.cancelWithdrawal("wd-1");

        expect(withdrawalRepository.updateStatus).toHaveBeenCalledWith(
            "wd-1",
            withdrawalStatus.CANCELLED,
            Prisma.JsonNull,
            tx
        );
    });

    it("refuses to cancel a withdrawal that is no longer pending", async () => {
        vi.mocked(withdrawalRepository.findById).mockResolvedValue({
            ...pendingWithdrawal,
            status: withdrawalStatus.SUCCESS,
        } as any);

        await expect(withdrawalService.cancelWithdrawal("wd-1")).rejects.toThrow(
            /Only pending withdrawals can be cancelled/
        );

        expect(walletRepository.updateBalance).not.toHaveBeenCalled();
    });
});
