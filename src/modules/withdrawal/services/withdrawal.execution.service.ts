import { Prisma, withdrawalStatus } from "@prisma/client";
import { prisma } from "../../../shared/config/database";
import { BusinessLogger } from "../../../shared/logger/business-logger";
import { withdrawalRepository } from "../repositories/withdrawal.repository";
import { getWithdrawalProvider } from "../providers/provider.factory";
import { auditService } from "../../audit/services/audit.services";
import { NotificationType } from "../../notification/types/notification.types";
import { notificationDispatcherService } from "../../notification/service/notification-dispatcher.service";

const withdrawalProvider = getWithdrawalProvider();

export interface WithdrawalExecutionResult {
    success: boolean;
    demo?: boolean;
    withdrawalId: string;
}

/**
 * Extracted withdrawal execution logic from withdrawal.worker.ts
 * Can be called from BullMQ worker OR QStash HTTP endpoint
 */
export const withdrawalExecutionService = {
    async executeWithdrawal(withdrawalId: string): Promise<WithdrawalExecutionResult> {
        BusinessLogger.info("Withdrawal execution started", { withdrawalId });

        /**
         * STEP 1: Lock withdrawal state
         */
        const withdrawal = await prisma.$transaction(async (tx) => {
            const withdrawal = await withdrawalRepository.findById(withdrawalId, tx);

            if (!withdrawal) {
                throw new Error("Withdrawal not found");
            }

            /**
             * Idempotency: already processed
             */
            if (withdrawal.status === withdrawalStatus.SUCCESS) {
                BusinessLogger.info("Withdrawal already processed", { withdrawalId });
                return withdrawal;
            }

            /**
             * Move state to PROCESSING
             */
            await withdrawalRepository.updateStatus(
                withdrawal.id,
                withdrawalStatus.PROCESSING,
                { worker: "withdrawal-execution-service" },
                tx
            );

            return withdrawal;
        });

        /**
         * Early return for already-processed withdrawals (idempotency)
         */
        if (withdrawal.status === withdrawalStatus.SUCCESS) {
            return {
                success: true,
                withdrawalId: withdrawal.id,
            };
        }

        //---------------------------------------
        // DEMO BYPASS: Check if withdrawal belongs to demo user
        //---------------------------------------
        const user = await prisma.user.findUnique({
            where: { id: withdrawal.userId },
            select: { id: true, isDemo: true },
        });

        if (user?.isDemo) {
            // Simulate processing delay for realism
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Mark withdrawal as success without calling bank API
            await prisma.$transaction(async (tx) => {
                await withdrawalRepository.updateStatus(
                    withdrawal.id,
                    withdrawalStatus.SUCCESS,
                    {
                        providerReference: `DEMO-${Date.now()}`,
                        message: "Demo withdrawal completed",
                        demo: true,
                    },
                    tx
                );

                // Update transaction status
                await tx.transaction.updateMany({
                    where: {
                        referenceNumber: withdrawal.referenceNumber,
                    },
                    data: {
                        status: "SUCCESS",
                        completedAt: new Date(),
                    },
                });
            });

            await auditService.log({
                userId: withdrawal.userId,
                action: "WITHDRAWAL_COMPLETED",
                resource: "WITHDRAWAL",
                entityId: withdrawal.id,
                metadata: {
                    referenceNumber: withdrawal.referenceNumber,
                    isDemo: true,
                    provider: "DEMO",
                },
            });

            // Send withdrawal success notification for demo user (multi-channel)
            notificationDispatcherService
                .dispatchFinancialNotification({
                    userId: withdrawal.userId,
                    type: NotificationType.WITHDRAW_SUCCESS,
                    title: "Penarikan berhasil",
                    message: `Penarikan sebesar Rp${withdrawal.netAmount
                        .toNumber()
                        .toLocaleString("id-ID")} telah berhasil diproses.`,
                    resource: "WITHDRAWAL",
                    entityId: withdrawal.id,
                    metadata: {
                        referenceNumber: withdrawal.referenceNumber,
                        amount: withdrawal.amount.toString(),
                        fee: withdrawal.fee.toString(),
                        netAmount: withdrawal.netAmount.toString(),
                        bankName: withdrawal.bankName || "Bank",
                        accountNumber: withdrawal.accountNumber || "",
                    },
                })
                .catch(() => {});

            BusinessLogger.info("Demo withdrawal completed (simulated)", {
                withdrawalId: withdrawal.id,
                userId: withdrawal.userId,
            });

            return {
                success: true,
                demo: true,
                withdrawalId: withdrawal.id,
            };
        }

        /**
         * STEP 2: Call external provider (NORMAL USERS ONLY)
         */
        const result = await withdrawalProvider.withdraw({
            withdrawalId: withdrawal.id,
            amount: withdrawal.amount.toString(),
            bankCode: withdrawal.bankCode ?? undefined,
            accountNumber: withdrawal.accountNumber ?? undefined,
            accountName: withdrawal.accountName ?? undefined,
        });

        /**
         * STEP 3: SUCCESS
         */
        if (result.success) {
            await prisma.$transaction(async (tx) => {
                await tx.withdrawal.update({
                    where: {
                        id: withdrawal.id,
                    },
                    data: {
                        status: withdrawalStatus.SUCCESS,
                        providerReference: result.providerReference,
                        providerResponse: result.response as Prisma.InputJsonValue,
                        processedAt: new Date(),
                    },
                });

                await auditService.log(
                    {
                        userId: withdrawal.userId,
                        action: "WITHDRAWAL_SUCCESS",
                        resource: "WITHDRAWAL",
                        entityId: withdrawal.id,
                        metadata: {
                            providerReference: result.providerReference,
                            amount: withdrawal.amount.toString(),
                        },
                    },
                    tx
                );

                // Send withdrawal success notification (multi-channel)
                notificationDispatcherService
                    .dispatchFinancialNotification(
                        {
                            userId: withdrawal.userId,
                            type: NotificationType.WITHDRAW_SUCCESS,
                            title: "Penarikan berhasil",
                            message: `Penarikan sebesar Rp${withdrawal.netAmount
                                .toNumber()
                                .toLocaleString("id-ID")} telah berhasil diproses.`,
                            resource: "WITHDRAWAL",
                            entityId: withdrawal.id,
                            metadata: {
                                referenceNumber: withdrawal.referenceNumber,
                                amount: withdrawal.amount.toString(),
                                fee: withdrawal.fee.toString(),
                                netAmount: withdrawal.netAmount.toString(),
                                bankName: withdrawal.bankName || "Bank",
                                accountNumber: withdrawal.accountNumber || "",
                            },
                        },
                        tx
                    )
                    .catch(() => {});
            });

            return {
                success: true,
                withdrawalId: withdrawal.id,
            };
        }

        /**
         * STEP 4: FAILED
         */
        await prisma.$transaction(async (tx) => {
            await withdrawalRepository.updateStatus(
                withdrawal.id,
                withdrawalStatus.FAILED,
                {
                    reason: result.reason ?? "Provider failed",
                },
                tx
            );

            await auditService.log(
                {
                    userId: withdrawal.userId,
                    action: "WITHDRAWAL_FAILED",
                    resource: "WITHDRAWAL",
                    entityId: withdrawal.id,
                    metadata: {
                        reason: result.reason,
                    },
                },
                tx
            );

            // Send withdrawal failed notification (multi-channel)
            notificationDispatcherService
                .dispatchFinancialNotification(
                    {
                        userId: withdrawal.userId,
                        type: NotificationType.WITHDRAW_FAILED,
                        title: "Penarikan gagal",
                        message: `Penarikan sebesar Rp${withdrawal.amount
                            .toNumber()
                            .toLocaleString("id-ID")} gagal diproses. ${
                            result.reason || "Silakan coba lagi."
                        }`,
                        resource: "WITHDRAWAL",
                        entityId: withdrawal.id,
                        metadata: {
                            referenceNumber: withdrawal.referenceNumber,
                            amount: withdrawal.amount.toString(),
                            reason: result.reason,
                        },
                    },
                    tx
                )
                .catch(() => {});
        });

        throw new Error(result.reason ?? "Withdrawal failed");
    },
};
