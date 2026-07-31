import { PaymentStatus } from "@prisma/client";
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


export class PaymentService {

    private async createPaymentProcess(
        userId: string,
        dto: CreatePaymentDTO
    ): Promise<PaymentResponse> {
        const user =
            await authRepository.findById(userId);

        if (!user) {
            throw new Error("User not found");
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

    async getStatus(referenceNumber: string) {

        const payment =
            await paymentRepository.findByReference(referenceNumber);

        if (!payment) {
            throw new Error("Payment not found");
        }

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

    async cancelPayment(referenceNumber: string) {

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

}

export const paymentService =
    new PaymentService();