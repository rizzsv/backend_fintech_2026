import { withdrawalStatus } from "@prisma/client";
import { BusinessLogger } from "../../../shared/logger/business-logger";
import { getWithdrawalProvider } from "../providers/provider.factory";
import { withdrawalRepository } from "../repositories/withdrawal.repository";

export class WithdrawalReconciliationService {
    private getProvider() {
        return getWithdrawalProvider();
    }

    async reconcile() {
        BusinessLogger.info("Withdrawal reconciliation started");

        // STEP 1: Read PROCESSING withdrawals OUTSIDE transaction
        const withdrawals = await withdrawalRepository.findProcessing();

        if (withdrawals.length === 0) {
            BusinessLogger.info("No withdrawals to reconcile");
            return;
        }

        BusinessLogger.info(`Reconciling ${withdrawals.length} withdrawal(s)`, {
            count: withdrawals.length,
        });

        // STEP 2: Process each withdrawal with external provider call OUTSIDE transaction
        for (const withdrawal of withdrawals) {
            try {
                if (!withdrawal.providerReference) {
                    BusinessLogger.warn("Withdrawal missing providerReference", {
                        withdrawalId: withdrawal.id,
                    });
                    continue;
                }

                // External provider call OUTSIDE any DB transaction
                const result = await this.getProvider().checkStatus(withdrawal.providerReference);

                // STEP 3: Short transaction for conditional state update only
                if (result.status === "SUCCESS") {
                    const updated = await withdrawalRepository.updateStatusConditional(
                        withdrawal.id,
                        withdrawalStatus.PROCESSING, // Expected current status
                        withdrawalStatus.SUCCESS,
                        {
                            providerResponse: result.response as any,
                            processedAt: new Date(),
                        }
                    );

                    if (updated.count > 0) {
                        BusinessLogger.info(`Withdrawal ${withdrawal.id} marked as SUCCESS`, {
                            withdrawalId: withdrawal.id,
                        });
                    } else {
                        BusinessLogger.warn(
                            `Withdrawal ${withdrawal.id} status changed during reconciliation (expected PROCESSING)`,
                            {
                                withdrawalId: withdrawal.id,
                            }
                        );
                    }
                }

                if (result.status === "FAILED") {
                    const updated = await withdrawalRepository.updateStatusConditional(
                        withdrawal.id,
                        withdrawalStatus.PROCESSING, // Expected current status
                        withdrawalStatus.FAILED,
                        {
                            failedReason: "Provider reported failure",
                            providerResponse: result.response as any,
                        }
                    );

                    if (updated.count > 0) {
                        BusinessLogger.info(`Withdrawal ${withdrawal.id} marked as FAILED`, {
                            withdrawalId: withdrawal.id,
                        });
                    } else {
                        BusinessLogger.warn(
                            `Withdrawal ${withdrawal.id} status changed during reconciliation (expected PROCESSING)`,
                            {
                                withdrawalId: withdrawal.id,
                            }
                        );
                    }
                }
            } catch (error) {
                BusinessLogger.error("Withdrawal reconciliation error", {
                    withdrawalId: withdrawal.id,
                    error,
                });
            }
        }

        BusinessLogger.info("Withdrawal reconciliation completed");
    }
}

export const withdrawalReconciliationService = new WithdrawalReconciliationService();
