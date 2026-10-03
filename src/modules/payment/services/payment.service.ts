import { PaymentStatus, Prisma, TransactionType, LedgerEntryType } from "@prisma/client";
import { paymentJob }from "../queue/payment.job";
import { PAYMENT_DESCRIPTION_PREFIX,PAYMENT_PROVIDER } from "../constants/payment.constants";
import { paymentRepository } from "../repositories/payment.repository";
import { midtransProvider } from "../providers/midtrans.provider";
import { CreatePaymentDTO,PaymentResponse } from "../types/payment.types";
import { retry } from "../../../shared/database/retry";
import { prisma } from "../../../shared/config/database";
import { BusinessLogger } from "../../../shared/logger/business-logger";
import { generateReferenceNumber } from "../../../shared/utils/reference.utils";
import { redisLock } from "../../../shared/lock/redis-lock.service";
import { authRepository } from "../../auth/repositories/auth.repository";
import { auditService } from "../../audit/services/audit.services";
import { AuditAction, AuditResource } from "../../audit/constant/audit.constan";
import { walletRepository } from "../../wallet/repositories/wallet.repository";
import { transactionRepository } from "../../transaction/repositories/transaction.repository";
import { AppError } from "../../../shared/errors/AppError";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { OptimisLockError } from "../../../shared/errors/optimistic-lock.error";
import { env } from "../../../shared/config/env";
import { notificationDispatcherService } from "../../notification/service/notification-dispatcher.service";
import { NotificationType } from "../../notification/types/notification.types";


export class PaymentService {

    /**
     * A payment is addressed by its reference number, which is predictable
     * enough to enumerate, so every reference-keyed read or mutation has to
     * confirm the caller owns the payment first.
     */
    private assertOwnership(
        ownerId: string,
        userId: string
    ) {
        if (ownerId !== userId) {
            throw new AppError(
                "Forbidden",
                403,
                "FORBIDDEN"
            );
        }
    }

    private async createPaymentProcess(
        userId: string,
        dto: CreatePaymentDTO
    ): Promise<PaymentResponse> {
        const user =
            await authRepository.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        //---------------------------------------
        // SIMULATED PAYMENT: For demo users OR when PAYMENT_MODE=simulated
        //---------------------------------------
        if (user.isDemo || env.PAYMENT_MODE === 'simulated') {
            return this.createSimulatedPayment(userId, dto, user.isDemo);
        }

        const referenceNumber =
            generateReferenceNumber("PAY");

        //---------------------------------------
        // Create Snap Transaction
        //---------------------------------------

        const snap =
            await midtransProvider.createTransaction({

                transaction_details: {
                    order_id: referenceNumber,
                    gross_amount: dto.amount,
                },

                customer_details: {
                    first_name: user.firstName ?? "",
                    email: user.email,
                    phone: user.phoneNumber ?? "",
                },

                item_details: [
                    {
                        id: referenceNumber,
                        price: dto.amount,
                        quantity: 1,
                        name: PAYMENT_DESCRIPTION_PREFIX,
                    },
                ],

                enabled_payments: [
                    dto.paymentMethod,
                ],

            });

        const providerResponse =
            JSON.parse(
                JSON.stringify(snap)
            );

        //---------------------------------------
        // Save Payment (retry + transaction)
        //---------------------------------------

        const payment = await retry(async () => {

            return prisma.$transaction(async (tx) => {

                return paymentRepository.create(
                    {
                        user: {
                            connect: {
                                id: userId,
                            },
                        },

                        amount: dto.amount,

                        provider:
                            PAYMENT_PROVIDER.MIDTRANS,

                        paymentMethod:
                            dto.paymentMethod,

                        referenceNumber,

                        paymentUrl:
                            snap.redirect_url,

                        providerResponse,

                        status:
                            PaymentStatus.PENDING,

                        expiredAt:
                            new Date(
                                Date.now() +
                                15 * 60 * 1000
                            ),
                    },
                    tx
                );

            });

        });

        await auditService.log(
            {
                userId,
                action: AuditAction.PAYMENT_CREATED,
                resource: AuditResource.PAYMENT,
                entityId: payment.id,
                metadata: {
                    amount: dto.amount.toString(),
                    paymentMethod: dto.paymentMethod,
                    provider: payment.provider,
                    referenceNumber: payment.referenceNumber,
                }
            }
        )

        await paymentJob.addReconciliationJob(
            payment.referenceNumber,
        );

        await paymentJob.addExpireJob(

            payment.referenceNumber,

            15 * 60 * 1000,

        );

        //---------------------------------------
        // Logging
        //---------------------------------------

        BusinessLogger.info(
            "Payment Created",
            {
                paymentId: payment.id,
                referenceNumber,
            }
        );

        //---------------------------------------
        // Response
        //---------------------------------------

        return {

            paymentId:
                payment.id,

            referenceNumber,

            provider:
                PAYMENT_PROVIDER.MIDTRANS,

            paymentMethod:
                dto.paymentMethod,

            amount:
                dto.amount,

            status:
                payment.status,

            paymentUrl:
                payment.paymentUrl ?? undefined,

            snapToken:
                snap.token,

            expiredAt:
                payment.expiredAt,
        };
    }

    async createPayment(
        userId: string,
        dto: CreatePaymentDTO
    ): Promise<PaymentResponse> {
        
        return redisLock.executeWithLock(
            `payment:create:${userId}:${dto.paymentMethod}:${dto.amount}`,
            async () => {
                return this.createPaymentProcess(
                    userId,
                    dto
                )
            },
            60
        )
    }

    async getPayment(id: string) {

        const payment =
            await paymentRepository.findById(id);

        if (!payment) {
            throw new Error("Payment not found");
        }

        return payment;
    }

    async getStatus(referenceNumber: string, userId: string) {

        const payment =
            await paymentRepository.findByReference(referenceNumber);

        if (!payment) {
            throw new NotFoundError("Payment not found");
        }

        this.assertOwnership(payment.userId, userId);

        const transaction =
            await midtransProvider.getTransaction(referenceNumber);

        return {
            paymentId: payment.id,
            referenceNumber,
            status: transaction.transaction_status,
            paymentType: transaction.payment_type,
            grossAmount: transaction.gross_amount,
            transactionTime: transaction.transaction_time,
            settlementTime: transaction.settlement_time,
        };
    }

    async getMonthlyTopUpReport(
        walletId: string,
        year: number,
        month: number,
        userId: string
) {
    /**
     * `walletId` arrives from the URL, so it has to be checked against the
     * caller's own wallet. Without this, any authenticated user could read
     * another user's monthly top-up total by guessing a wallet id.
     */
    const wallet = await walletRepository.findByUserId(userId);

    if (!wallet || wallet.id !== walletId) {
        throw new NotFoundError("Wallet not found");
    }

    const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return paymentRepository.getMonthlyTopUpTotal(
        walletId,
        startDate,
        endDate
    );
}

    async cancelPayment(referenceNumber: string, userId: string) {

        const payment =
            await paymentRepository.findByReference(referenceNumber);

        if (!payment) {
            throw new NotFoundError("Payment not found");
        }

        this.assertOwnership(payment.userId, userId);

        await midtransProvider.cancelTransaction(
            referenceNumber
        );

        return paymentRepository.updateStatus(
            referenceNumber,
            PaymentStatus.FAILED,
            {}
        );
    }

    async expirePayment(referenceNumber: string) {

        await midtransProvider.expireTransaction(
            referenceNumber
        );

        return paymentRepository.updateStatus(
            referenceNumber,
            PaymentStatus.EXPIRED,
            {}
        );
    }

    /**
     * SIMULATED PAYMENT: For demo users OR portfolio production mode
     * - No external payment gateway call
     * - Instant success
     * - Credits wallet immediately
     * - Preserves existing transaction/wallet business logic
     * - Dispatches multi-channel notifications
     */
    private async createSimulatedPayment(
        userId: string,
        dto: CreatePaymentDTO,
        isDemo: boolean = false
    ): Promise<PaymentResponse> {
        const referenceNumber = generateReferenceNumber(
            isDemo ? "DEMO-PAY" : "SIM-PAY"
        );

        // Simulate payment processing in transaction
        const payment = await retry(async () => {
            return prisma.$transaction(async (tx) => {
                // Create payment record (instant success)
                const payment = await paymentRepository.create(
                    {
                        user: {
                            connect: {
                                id: userId,
                            },
                        },
                        amount: dto.amount,
                        provider: PAYMENT_PROVIDER.SIMULATED,
                        paymentMethod: dto.paymentMethod,
                        referenceNumber,
                        paymentUrl: null,
                        providerResponse: {
                            simulated: true,
                            isDemo,
                            message: isDemo 
                                ? "Demo payment - instant success" 
                                : "Simulated payment - instant success (portfolio mode)",
                        },
                        status: PaymentStatus.SUCCESS,
                        expiredAt: new Date(
                            Date.now() + 15 * 60 * 1000
                        ),
                    },
                    tx
                );

                // Credit wallet immediately (reuse existing business logic)
                const wallet = await walletRepository.findByUserId(userId, tx);
                
                if (!wallet) {
                    throw new Error("Wallet not found");
                }

                const updatedWallet = await walletRepository.updateBalance(
                    tx,
                    wallet.id,
                    wallet.version,
                    new Prisma.Decimal(dto.amount)
                );

                if (updatedWallet.count === 0) {
                    throw new OptimisLockError();
                }

                // Create transaction record
                const transaction = await tx.transaction.create({
                    data: {
                        fromWallet: undefined,
                        toWallet: {
                            connect: {
                                id: wallet.id,
                            },
                        },
                        amount: dto.amount,
                        transactionType: TransactionType.TOPUP,
                        status: "SUCCESS",
                        description: `${isDemo ? 'Demo' : 'Simulated'} top-up ${referenceNumber}`,
                        referenceNumber,
                        idempotencyKey: referenceNumber,
                        completedAt: new Date(),
                        metadata: { 
                            simulated: true,
                            isDemo,
                        },
                    },
                });

                // Create ledger entry
                await tx.ledgerEntry.create({
                    data: {
                        transactionId: transaction.id,
                        walletId: wallet.id,
                        entryType: LedgerEntryType.CREDIT,
                        amount: new Prisma.Decimal(dto.amount),
                        balanceAfter: wallet.balance.plus(dto.amount),
                        description: `${isDemo ? 'Demo' : 'Simulated'} payment ${referenceNumber}`,
                    },
                });

                // Dispatch multi-channel notifications
                await notificationDispatcherService.dispatchFinancialNotification(
                    {
                        userId,
                        type: NotificationType.TOPUP_SUCCESS,
                        title: "Top up berhasil",
                        message: `Top up sebesar Rp${dto.amount.toLocaleString('id-ID')} berhasil masuk ke wallet Anda.`,
                        resource: "PAYMENT",
                        entityId: payment.id,
                        metadata: {
                            referenceNumber,
                            amount: dto.amount.toString(),
                            simulated: true,
                            isDemo,
                        },
                    },
                    tx
                );

                return payment;
            });
        });

        await auditService.log({
            userId,
            action: AuditAction.PAYMENT_CREATED,
            resource: AuditResource.PAYMENT,
            entityId: payment.id,
            metadata: {
                amount: dto.amount.toString(),
                paymentMethod: dto.paymentMethod,
                provider: PAYMENT_PROVIDER.SIMULATED,
                referenceNumber: payment.referenceNumber,
                simulated: true,
                isDemo,
            }
        });

        BusinessLogger.info(
            isDemo ? "Demo Payment Created (Simulated)" : "Simulated Payment Created (Portfolio Mode)",
            {
                paymentId: payment.id,
                referenceNumber,
                userId,
                isDemo,
            }
        );

        return {
            paymentId: payment.id,
            referenceNumber,
            provider: PAYMENT_PROVIDER.SIMULATED as any,
            paymentMethod: dto.paymentMethod,
            amount: dto.amount,
            status: payment.status,
            paymentUrl: undefined,
            snapToken: undefined,
            expiredAt: payment.expiredAt,
        };
    }

}

export const paymentService =
    new PaymentService();