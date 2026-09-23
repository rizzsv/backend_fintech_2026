import { PaymentStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { midtransProvider } from "../../../src/modules/payment/providers/midtrans.provider";
import { paymentRepository } from "../../../src/modules/payment/repositories/payment.repository";
import { paymentService } from "../../../src/modules/payment/services/payment.service";
import { walletRepository } from "../../../src/modules/wallet/repositories/wallet.repository";

vi.mock("../../../src/modules/payment/repositories/payment.repository", () => ({
    paymentRepository: {
        findByReference: vi.fn(),
        getMonthlyTopUpTotal: vi.fn(),
        updateStatus: vi.fn(),
    },
}));

vi.mock("../../../src/modules/payment/providers/midtrans.provider", () => ({
    midtransProvider: {
        getTransaction: vi.fn(),
        cancelTransaction: vi.fn(),
    },
}));

vi.mock("../../../src/modules/wallet/repositories/wallet.repository", () => ({
    walletRepository: {
        findByUserId: vi.fn(),
    },
}));

// The job producer opens a Redis connection on import, which is unavailable in unit runs.
vi.mock("../../../src/modules/payment/queue/payment.job", () => ({
    paymentJob: {
        addReconciliationJob: vi.fn(),
        addExpireJob: vi.fn(),
    },
}));

const OWNER = "user-owner";
const ATTACKER = "user-attacker";
const REFERENCE = "PAY20260101ABCDEF12";

const ownedPayment = {
    id: "pay-1",
    userId: OWNER,
    referenceNumber: REFERENCE,
    status: PaymentStatus.PENDING,
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(paymentRepository.findByReference).mockResolvedValue(ownedPayment as any);
});

/**
 * A reference number is sequential enough to enumerate, so an authenticated
 * caller must not be able to read or mutate a payment belonging to someone else.
 */
describe("paymentService.getStatus", () => {
    it("returns the provider status to the owner", async () => {
        vi.mocked(midtransProvider.getTransaction).mockResolvedValue({
            transaction_status: "settlement",
            payment_type: "qris",
            gross_amount: "100000.00",
            transaction_time: "2026-01-01 10:00:00",
            settlement_time: "2026-01-01 10:01:00",
        } as any);

        const result = await paymentService.getStatus(REFERENCE, OWNER);

        expect(result.paymentId).toBe("pay-1");
        expect(result.status).toBe("settlement");
    });

    it("rejects a caller who does not own the payment", async () => {
        await expect(paymentService.getStatus(REFERENCE, ATTACKER)).rejects.toThrow(
            /Forbidden/
        );

        // The provider must not be reached on an unauthorised read.
        expect(midtransProvider.getTransaction).not.toHaveBeenCalled();
    });

    it("reports a missing payment as not found", async () => {
        vi.mocked(paymentRepository.findByReference).mockResolvedValue(null as any);

        await expect(paymentService.getStatus(REFERENCE, OWNER)).rejects.toThrow(
            /Payment not found/
        );
    });
});

describe("paymentService.cancelPayment", () => {
    it("cancels the payment for its owner", async () => {
        await paymentService.cancelPayment(REFERENCE, OWNER);

        expect(midtransProvider.cancelTransaction).toHaveBeenCalledWith(REFERENCE);
        expect(paymentRepository.updateStatus).toHaveBeenCalledWith(
            REFERENCE,
            PaymentStatus.FAILED,
            {}
        );
    });

    it("refuses to cancel a payment owned by another user", async () => {
        await expect(paymentService.cancelPayment(REFERENCE, ATTACKER)).rejects.toThrow(
            /Forbidden/
        );

        expect(midtransProvider.cancelTransaction).not.toHaveBeenCalled();
        expect(paymentRepository.updateStatus).not.toHaveBeenCalled();
    });
});

describe("paymentService.getMonthlyTopUpReport", () => {
    it("reports totals for the caller's own wallet", async () => {
        vi.mocked(walletRepository.findByUserId).mockResolvedValue({
            id: "wallet-owner",
        } as any);
        vi.mocked(paymentRepository.getMonthlyTopUpTotal).mockResolvedValue(250_000 as any);

        const result = await paymentService.getMonthlyTopUpReport(
            "wallet-owner",
            2026,
            1,
            OWNER
        );

        expect(result).toBe(250_000);

        // January 2026 spans the 1st through the 31st inclusive.
        const [, startDate, endDate] = vi.mocked(
            paymentRepository.getMonthlyTopUpTotal
        ).mock.calls[0];

        expect((startDate as Date).getMonth()).toBe(0);
        expect((startDate as Date).getDate()).toBe(1);
        expect((endDate as Date).getMonth()).toBe(0);
        expect((endDate as Date).getDate()).toBe(31);
    });

    it("refuses to report on a wallet the caller does not own", async () => {
        vi.mocked(walletRepository.findByUserId).mockResolvedValue({
            id: "wallet-attacker",
        } as any);

        await expect(
            paymentService.getMonthlyTopUpReport("wallet-owner", 2026, 1, ATTACKER)
        ).rejects.toThrow(/Wallet not found/);

        expect(paymentRepository.getMonthlyTopUpTotal).not.toHaveBeenCalled();
    });
});
