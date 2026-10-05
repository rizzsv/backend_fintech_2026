import { describe, it, expect, beforeEach, vi } from "vitest";
import { withdrawalStatus } from "@prisma/client";

// Mock dependencies before imports
vi.mock("../../../src/modules/withdrawal/repositories/withdrawal.repository", () => ({
    withdrawalRepository: {
        findProcessing: vi.fn(),
        updateStatusConditional: vi.fn(),
    },
}));

vi.mock("../../../src/modules/withdrawal/providers/provider.factory", () => ({
    getWithdrawalProvider: vi.fn(),
}));

vi.mock("../../../src/shared/logger/business-logger", () => ({
    BusinessLogger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

// Import after mocks
import { withdrawalReconciliationService } from "../../../src/modules/withdrawal/reconciliation/withdrawal.reconciliation.service";
import { withdrawalRepository } from "../../../src/modules/withdrawal/repositories/withdrawal.repository";
import { getWithdrawalProvider } from "../../../src/modules/withdrawal/providers/provider.factory";

describe("Withdrawal Reconciliation - Architecture", () => {
    let mockProvider: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockProvider = {
            checkStatus: vi.fn(),
        };

        vi.mocked(getWithdrawalProvider).mockReturnValue(mockProvider);
    });

    it("should read withdrawals OUTSIDE transaction", async () => {
        const mockWithdrawals = [
            {
                id: "wth_1",
                status: withdrawalStatus.PROCESSING,
                providerReference: "PRV123",
            },
        ];

        vi.mocked(withdrawalRepository.findProcessing).mockResolvedValue(mockWithdrawals as any);
        vi.mocked(withdrawalRepository.updateStatusConditional).mockResolvedValue({ count: 1 } as any);
        mockProvider.checkStatus.mockResolvedValue({ status: "SUCCESS", response: {} });

        await withdrawalReconciliationService.reconcile();

        // Verify findProcessing called WITHOUT transaction parameter
        expect(withdrawalRepository.findProcessing).toHaveBeenCalledWith();
    });

    it("should call provider.checkStatus before database update", async () => {
        const mockWithdrawals = [
            {
                id: "wth_1",
                status: withdrawalStatus.PROCESSING,
                providerReference: "PRV123",
            },
        ];

        const callSequence: string[] = [];

        vi.mocked(withdrawalRepository.findProcessing).mockResolvedValue(mockWithdrawals as any);

        mockProvider.checkStatus.mockImplementation(async () => {
            callSequence.push("provider");
            return { status: "SUCCESS", response: {} };
        });

        vi.mocked(withdrawalRepository.updateStatusConditional).mockImplementation(async () => {
            callSequence.push("update");
            return { count: 1 } as any;
        });

        await withdrawalReconciliationService.reconcile();

        // Provider call happens before DB update
        expect(callSequence).toEqual(["provider", "update"]);
    });

    it("should use conditional update with expected status", async () => {
        const mockWithdrawals = [
            {
                id: "wth_1",
                status: withdrawalStatus.PROCESSING,
                providerReference: "PRV123",
            },
        ];

        vi.mocked(withdrawalRepository.findProcessing).mockResolvedValue(mockWithdrawals as any);
        vi.mocked(withdrawalRepository.updateStatusConditional).mockResolvedValue({ count: 1 } as any);
        mockProvider.checkStatus.mockResolvedValue({ status: "SUCCESS", response: {} });

        await withdrawalReconciliationService.reconcile();

        // Verify conditional update with PROCESSING as expected status
        expect(withdrawalRepository.updateStatusConditional).toHaveBeenCalledWith(
            "wth_1",
            withdrawalStatus.PROCESSING,
            withdrawalStatus.SUCCESS,
            expect.objectContaining({
                processedAt: expect.any(Date),
            })
        );
    });

    it("should handle concurrent status change gracefully", async () => {
        const mockWithdrawals = [
            {
                id: "wth_1",
                status: withdrawalStatus.PROCESSING,
                providerReference: "PRV123",
            },
        ];

        vi.mocked(withdrawalRepository.findProcessing).mockResolvedValue(mockWithdrawals as any);
        // Simulate status already changed (count=0)
        vi.mocked(withdrawalRepository.updateStatusConditional).mockResolvedValue({ count: 0 } as any);
        mockProvider.checkStatus.mockResolvedValue({ status: "SUCCESS", response: {} });

        // Should not throw
        await expect(withdrawalReconciliationService.reconcile()).resolves.not.toThrow();
    });

    it("should skip withdrawals without providerReference", async () => {
        const mockWithdrawals = [
            {
                id: "wth_1",
                status: withdrawalStatus.PROCESSING,
                providerReference: null,
            },
        ];

        vi.mocked(withdrawalRepository.findProcessing).mockResolvedValue(mockWithdrawals as any);

        await withdrawalReconciliationService.reconcile();

        // Provider should NOT be called
        expect(mockProvider.checkStatus).not.toHaveBeenCalled();
    });

    it("should handle provider errors without affecting other withdrawals", async () => {
        const mockWithdrawals = [
            {
                id: "wth_1",
                status: withdrawalStatus.PROCESSING,
                providerReference: "PRV123",
            },
            {
                id: "wth_2",
                status: withdrawalStatus.PROCESSING,
                providerReference: "PRV456",
            },
        ];

        vi.mocked(withdrawalRepository.findProcessing).mockResolvedValue(mockWithdrawals as any);
        vi.mocked(withdrawalRepository.updateStatusConditional).mockResolvedValue({ count: 1 } as any);

        mockProvider.checkStatus
            .mockRejectedValueOnce(new Error("Provider timeout"))
            .mockResolvedValueOnce({ status: "SUCCESS", response: {} });

        await withdrawalReconciliationService.reconcile();

        // Second withdrawal should still be processed
        expect(mockProvider.checkStatus).toHaveBeenCalledTimes(2);
        expect(withdrawalRepository.updateStatusConditional).toHaveBeenCalledTimes(1);
    });

    it("should mark withdrawal as FAILED when provider reports failure", async () => {
        const mockWithdrawals = [
            {
                id: "wth_1",
                status: withdrawalStatus.PROCESSING,
                providerReference: "PRV123",
            },
        ];

        vi.mocked(withdrawalRepository.findProcessing).mockResolvedValue(mockWithdrawals as any);
        vi.mocked(withdrawalRepository.updateStatusConditional).mockResolvedValue({ count: 1 } as any);
        mockProvider.checkStatus.mockResolvedValue({ status: "FAILED", response: {} });

        await withdrawalReconciliationService.reconcile();

        expect(withdrawalRepository.updateStatusConditional).toHaveBeenCalledWith(
            "wth_1",
            withdrawalStatus.PROCESSING,
            withdrawalStatus.FAILED,
            expect.objectContaining({
                failedReason: "Provider reported failure",
            })
        );
    });
});
