import { EntryType, LedgerEntryType, Prisma, TransactionStatus, TransactionType, withdrawalStatus } from "@prisma/client";
import { prisma } from "../../../shared/config/database";
import { retry } from "../../../shared/database/retry";
import { BusinessLogger } from "../../../shared/logger/business-logger";
import { generateReferenceNumber } from "../../../shared/utils/reference.utils";
import { walletRepository } from "../../wallet/repositories/wallet.repository";
import { withdrawalRepository } from "../repositories/withdrawal.repository";
import { CreateWithdrawalDTO, WithdrawalResponse } from "../types/withdrawal.types";
import { WITHDRAWAL_CONSTANTS } from "../constants/withdrawal.constants";
import { auditService } from "../../audit/services/audit.services";
import { withdrawalBusinessValidator } from "../validators/withdrawal.business.validator";
import { withdrawalQueue } from "../queue/withdrawal.queue";
import { formatWithdrawalResponse } from "../utils/withdrawal.mapper";
import { withdrawalRiskService } from "../security/withdrawal-risk.service";

export const withdrawalService = {
   async createWithdrawal(
    userId: string,
    dto: CreateWithdrawalDTO
): Promise<WithdrawalResponse> {


    BusinessLogger.info(
        "Creating withdrawal",
        {
            userId,
            amount: dto.amount,
        }
    );


    const amount =
        new Prisma.Decimal(
            dto.amount
        );


    const fee =
        new Prisma.Decimal(
            WITHDRAWAL_CONSTANTS.FEE
        );


    const netAmount =
        amount.minus(fee);



    const referenceNumber =
        generateReferenceNumber(
            WITHDRAWAL_CONSTANTS.REFERENCE_PREFIX
        );



    withdrawalBusinessValidator.validateAmount(
        amount
    );


    withdrawalBusinessValidator.validateBankAccount(
        dto.method,
        dto.bankCode,
        dto.accountNumber
    );

    const risk =
        await withdrawalRiskService.check(
            amount.toNumber()
        );


    if(risk.risky){

        await auditService.log({

            userId,

            action:
            "WITHDRAWAL_HIGH_RISK",

            resource:
            "WITHDRAWAL",

            metadata:{
                ...risk,

                amount:
                amount.toString()
            }

        });

    }



    return retry<WithdrawalResponse>(
    async()=>{


        return prisma.$transaction(
        async(tx)=>{


            const existing =
            await withdrawalRepository.findByIdempotencyKey(
                dto.idempotencyKey,
                tx
            );


            if(existing){

                return formatWithdrawalResponse(
                    existing
                );

            }


            const wallet =
            await walletRepository.findByUserId(
                userId,
                tx
            );


            if(!wallet){

                throw new Error(
                    "Wallet not found"
                );

            }


            withdrawalBusinessValidator.validateBalance(
                wallet.balance,
                amount
            );



            const dailyTotal =
            await withdrawalRepository.getDailyTotal(
                userId,
                tx
            );


            withdrawalBusinessValidator.validateDailyLimit(
                dailyTotal,
                amount
            );


            const updated =
            await walletRepository.updateBalance(
                tx,
                wallet.id,
                wallet.version,
                amount.negated()
            );


            if(updated.count === 0){

                throw new Error(
                    "Wallet version conflict"
                );

            }


            const withdrawal =
            await withdrawalRepository.create(

            {

                user:{
                    connect:{
                        id:userId
                    }
                },


                wallet:{
                    connect:{
                        id:wallet.id
                    }
                },


                idempotencyKey:
                    dto.idempotencyKey,


                amount,

                fee,

                netAmount,


                method:
                    dto.method,


                bankCode:
                    dto.bankCode,


                accountNumber:
                    dto.accountNumber,


                accountName:
                    dto.accountName,


                referenceNumber,


                status:
                    withdrawalStatus.PENDING,


            },

            tx

            );


            const transaction =
            await tx.transaction.create({

                data:{


                    fromWallet:{
                        connect:{
                            id:wallet.id
                        }
                    },


                    // TODO:
                    // nanti lebih bagus pakai SYSTEM WALLET
                    toWallet:{
                        connect:{
                            id:wallet.id
                        }
                    },


                    amount,

                    fee,


                    transactionType:
                    TransactionType.WITHDRAWAL,


                    status:
                    TransactionStatus.PENDING,


                    description:
                    `Withdrawal ${referenceNumber}`,


                    referenceNumber,


                    idempotencyKey:
                    referenceNumber,


                }

            });


            await tx.ledgerEntry.create({

                data:{


                    transactionId:
                    transaction.id,


                    walletId:
                    wallet.id,


                    entryType:
                    EntryType.DEBIT,


                    amount,


                    balanceAfter:
                    wallet.balance.minus(amount),


                    description:
                    `Withdrawal initiated ${referenceNumber}`


                }

            });


            await auditService.log({

                userId,


                action:
                "WITHDRAWAL_CREATED",


                resource:
                "WITHDRAWAL",


                entityId:
                withdrawal.id,


                metadata:{

                    referenceNumber,

                    amount:
                    amount.toString(),

                    risk

                }

            });



            return {

                withdrawalId:
                withdrawal.id,


                referenceNumber:
                withdrawal.referenceNumber,


                status:
                withdrawal.status,


                amount:
                withdrawal.amount.toNumber(),


                fee:
                withdrawal.fee.toNumber(),


                netAmount:
                withdrawal.netAmount.toNumber(),

            };


        });


    });

},

    async getWithdrawal(
        id: string
    ) {
        const withdrawal = await prisma.$transaction(async (tx) => {
            return withdrawalRepository.findById(id, tx);
        })

        if (!withdrawal) {
            throw new Error("Withdrawal not found");
        }

        return withdrawal;
    },

    async getStatus(
        referenceNumber: string
    ) {
        const withdrawal = await prisma.$transaction(async (tx) => {
            return withdrawalRepository.findByReference(referenceNumber, tx);
        })

        if (!withdrawal) {
            throw new Error("Withdrawal not found");
        }

        return {
            withdrawalId: withdrawal.id,
            referenceNumber: withdrawal.referenceNumber,
            status: withdrawal.status,
            amount: withdrawal.amount.toNumber(),
            fee: withdrawal.fee.toNumber(),
            netAmount: withdrawal.netAmount.toNumber(),
            provider: withdrawal.providerResponse,
            processedAt: withdrawal.processedAt,
            failedReason: withdrawal.failedReason,
            createdAt: withdrawal.createdAt,
        }
    },

    async cancelWithdrawal(
        id: string
    ) {
        return retry(async () => {
            return prisma.$transaction(async (tx) => {
                const withdrawal = await withdrawalRepository.findById(id, tx);

                if (!withdrawal) {
                    throw new Error("Withdrawal not found");
                }

                if (withdrawal.status !== withdrawalStatus.PENDING) {
                    throw new Error("Only pending withdrawals can be cancelled");
                }

                const wallet = await walletRepository.findById(withdrawal.walletId, tx);
                if (!wallet) {
                    throw new Error("Wallet not found for withdrawal");
                }

                const updated = await walletRepository.updateBalance(
                    tx,
                    wallet.id,
                    wallet.version,
                    withdrawal.amount.plus(withdrawal.fee)
                );

                if (updated.count === 0) {
                    throw new Error("Failed to update wallet balance due to version mismatch");
                }

                await withdrawalRepository.updateStatus(
                    withdrawal.id,
                    withdrawalStatus.CANCELLED,
                    Prisma.JsonNull,
                    tx
                );

                const transaction = await tx.transaction.create({
                    data: {

                        fromWallet: {
                            connect: {
                                id: wallet.id,
                            },
                        },

                        toWallet: {
                            connect: {
                                id: wallet.id,
                            },
                        },

                        amount:
                            withdrawal.amount,

                        fee:
                            withdrawal.fee,

                        transactionType:
                            TransactionType.REFUND,

                        status:
                            TransactionStatus.SUCCESS,

                        description:
                            `Withdrawal cancellation ${withdrawal.referenceNumber}`,

                        referenceNumber:
                            `REFUND-${withdrawal.referenceNumber}`,

                        idempotencyKey:
                            `REFUND-${withdrawal.referenceNumber}`,

                    },
                });


                await tx.ledgerEntry.create({
                    data: {

                        transactionId:
                            transaction.id,

                        walletId:
                            wallet.id,

                        entryType:
                            LedgerEntryType.CREDIT,

                        amount:
                            withdrawal.amount
                                .plus(withdrawal.fee),

                        balanceAfter:
                            wallet.balance
                                .plus(withdrawal.amount)
                                .plus(withdrawal.fee),

                        description:
                            `Withdrawal cancelled ${withdrawal.referenceNumber}`,

                    },
                });

                await auditService.log({
                    userId: withdrawal.userId,
                    action: "WITHDRAWAL_CANCELLED",
                    resource: "WITHDRAWAL",
                    entityId: withdrawal.id,
                    metadata: {
                        referenceNumber: withdrawal.referenceNumber,
                    }
                });

                BusinessLogger.info(
                    `Withdrawal ${withdrawal.referenceNumber} cancelled for user ${withdrawal.userId}`,
                    {
                        withdrawalId: withdrawal.id,
                    }
                );

                return {
                    success: true,
                }

            })
        })
    }

};