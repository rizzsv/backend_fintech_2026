import { withdrawalStatus } from "@prisma/client";
import { prisma } from "../../../shared/config/database";
import { BusinessLogger } from "../../../shared/logger/business-logger";
import { getWithdrawalProvider } from "../providers/provider.factory";
import { withdrawalRepository } from "../repositories/withdrawal.repository";

export class WithdrawalReconciliationService {
    private provider = getWithdrawalProvider();

    async reconcile() {
        BusinessLogger.info(
            "Withdrawal reconciliation started"
        );

        await prisma.$transaction(async (tx) => {
            const withdrawals = await withdrawalRepository.findProcessing(
                tx
            );

            for(
                const withdrawal of withdrawals
            ) {
                try {
                    if(
                        !withdrawal.providerReference
                    ) {
                        continue;
                    }

                    const result = await this.provider.checkStatus(
                        withdrawal.providerReference
                    );

                    if(
                        result.status === "SUCCESS" 
                    ){
                        await tx.withdrawal.update({
                            where: {
                                id: withdrawal.id
                            },
                            data: {
                                status: withdrawalStatus.SUCCESS,
                                providerResponse: result.response as any,
                                processedAt: new Date()
                            }
                        });

                        BusinessLogger.info(
                            `Withdrawal ${withdrawal.id} marked as SUCCESS`,
                            {
                                withdrawalId: withdrawal.id,
                            }
                        )
                    }

                    if(
                        result.status === "FAILED"
                    ){
                        await tx.withdrawal.update({
                            where: {
                                id: withdrawal.id
                            },
                            data: {
                                status: withdrawalStatus.FAILED,
                                failedReason: "Provider reported failure",
                                providerResponse: result.response as any,
                            }
                        })
                    }
                }  catch (error) {
                    BusinessLogger.error(
                        "Withdrawal reconciliation error",
                        {
                            withdrawalId: withdrawal.id,
                            error
                        }
                    )
                }
            }
        })
    }
}

export const withdrawalReconciliationService = new WithdrawalReconciliationService();