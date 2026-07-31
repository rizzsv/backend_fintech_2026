import crypto from "crypto";
import { LedgerEntryType, PaymentStatus, Prisma, TransactionType } from "@prisma/client";
import { Request } from "express";
import { env } from "../../../shared/config/env";
import { prisma } from "../../../shared/config/database";
import { BusinessLogger } from "../../../shared/logger/business-logger";
import { redisLock } from "../../../shared/lock/redis-lock.service";
import { walletRepository } from "../../wallet/repositories/wallet.repository";
import { transactionRepository } from "../../transaction/repositories/transaction.repository";
import { paymentRepository } from "../repositories/payment.repository";
import { midtransProvider } from "../providers/midtrans.provider";
import { paymentWebhookQueue } from "../queue/payment-webhook.queue";
import { OptimisLockError } from "../../../shared/errors/optimistic-lock.error";
import { AuditAction, AuditActorType, AuditResource } from "../../audit/constant/audit.constan";
import { auditService } from "../../audit/services/audit.services";
import {injectTraceContext} from "../../../shared/telemetry/worker-tracing";
import { withSpan } from "../../../shared/telemetry/span";


interface MidtransNotification {
    order_id: string;
    transaction_status: string;
    fraud_status?: string;
    transaction_id: string;
    status_code: string;
    gross_amount: string;
    signature_key: string;
}

export class PaymentWebhookService {
    async handle(req: Request) {
        const notification = req.body as MidtransNotification;
        const valid = midtransProvider.verifySignature(notification);

        if (valid) {
            await this.handleNotification(notification);
        }

        return midtransProvider.getTransaction(notification.order_id);
    }

    async handleNotification(payload: MidtransNotification) {
        await paymentWebhookQueue.add(
            "payment-webhook",
            {
                notification: payload,
                traceContext: injectTraceContext(),
            }
        )
    }

    public async processWebhook(payload: MidtransNotification) {
        const signature = crypto
            .createHash("sha512")
            .update(
                payload.order_id +
                payload.status_code +
                payload.gross_amount +
                env.MIDTRANS_SERVER_KEY
            )
            .digest("hex");

        if (signature !== payload.signature_key) {
            throw new Error("Invalid Midtrans signature");
        }

        return withSpan("payment.webhook",
            async()=>{
                        return prisma.$transaction(async (tx) => {
            const payment = await paymentRepository.findByReference(payload.order_id, tx);

            if (!payment) {
                throw new Error("Payment not found");
            }

            if (payment.status === PaymentStatus.SUCCESS) {
                BusinessLogger.info("Duplicate webhook ignored", {
                    paymentId: payment.id,
                    reference: payment.referenceNumber,
                });

                return {
                    success: true,
                    message: "Already processed",
                };
            }

            const paymentStatus = this.mapPaymentStatus(payload.transaction_status);

            if (paymentStatus !== PaymentStatus.SUCCESS) {
                await paymentRepository.updateStatus(
                    payment.referenceNumber,
                    paymentStatus,
                    JSON.parse(JSON.stringify(payload)),
                    tx
                );

                return {
                    success: true,
                    message: "Payment updated",
                };


            }

            await tx.payment.update({
                where: {
                    id: payment.id,
                },
                data: {
                    status: PaymentStatus.SUCCESS,
                    providerResponse:
                        JSON.parse(JSON.stringify(payload)),
                },
            });

            const wallet = await walletRepository.findByUserId(payment.userId, tx);

            if (!wallet) {
                throw new Error("Wallet not found");
            }

            const updated = await walletRepository.updateBalance(
                tx,
                wallet.id,
                wallet.version,
                payment.amount
            );

            if (updated.count === 0) {

                throw new OptimisLockError();

            }

            const transaction = await transactionRepository.create(
                {
                    amount: payment.amount,
                    fee: new Prisma.Decimal(0),
                    transactionType: TransactionType.TOPUP,
                    status: "SUCCESS",
                    referenceNumber: payment.referenceNumber,
                    idempotencyKey: payment.referenceNumber,
                    paymentChannel: "MIDTRANS",
                    externalReference: payload.transaction_id,
                    metadata: JSON.parse(JSON.stringify(payload)),
                    toWallet: {
                        connect: {
                            id: wallet.id,
                        },
                    },
                },
                tx
            );

            await tx.ledgerEntry.create({
                data: {
                    walletId: wallet.id,
                    transactionId: transaction.id,
                    entryType: LedgerEntryType.CREDIT,
                    amount: payment.amount,
                    balanceAfter: wallet.balance.plus(payment.amount),
                    description: "Topup Success",
                },
            });

            await auditService.log(

                {

                    userId: payment.userId,

                    actorType: AuditActorType.WEBHOOK,

                    action: AuditAction.PAYMENT_SUCCESS,

                    resource: AuditResource.PAYMENT,

                    entityId: payment.id,

                    metadata: {

                        amount:
                            payment.amount.toString(),

                        provider:
                            "MIDTRANS",

                        referenceNumber:
                            payment.referenceNumber,

                        transactionId:
                            payload.transaction_id,

                        paymentChannel:
                            "MIDTRANS",

                    },

                },

                tx

            );

            await auditService.log(

                {

                    userId: wallet.userId,

                    actorType: AuditActorType.WEBHOOK,

                    action: AuditAction.WALLET_CREDIT,

                    resource: AuditResource.WALLET,

                    entityId: wallet.id,

                    metadata: {

                        amount:
                            payment.amount.toString(),

                        balanceBefore:
                            wallet.balance.toString(),

                        balanceAfter:
                            wallet.balance
                                .plus(payment.amount)
                                .toString(),

                        transactionReference:
                            payment.referenceNumber,

                    },

                },

                tx

            );

            BusinessLogger.info("Payment completed", {
                paymentId: payment.id,
                walletId: wallet.id,
                transactionId: transaction.id,
                amount: payment.amount,
                reference: payment.referenceNumber,
            });

            return {
                success: true,
                message: "Payment success",
            };

        });
            }
        )
    }

    private mapPaymentStatus(transactionStatus: string): PaymentStatus {
        switch (transactionStatus) {
            case "capture":
            case "settlement":
                return PaymentStatus.SUCCESS;
            case "pending":
                return PaymentStatus.PENDING;
            case "deny":
            case "cancel":
            case "expire":
                return PaymentStatus.FAILED;
            default:
                return PaymentStatus.PENDING;
        }
    }
}

export const paymentWebhookService = new PaymentWebhookService();