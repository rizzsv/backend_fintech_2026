import { prisma } from "../../../shared/config/database";
import { EntryType, Prisma, TransactionStatus, TransactionType } from "@prisma/client";
import { TransactionMapper } from "../mapper/transaction.mapper";
import { transactionRepository, TransactionRepository } from "../repositories/transaction.repository";
import { walletRepository, WalletRepository } from "../../wallet/repositories/wallet.repository";
import { ledgerRepository } from "../../ledger/index"
import { feeService } from "../../fee/service/fee.service";
import { notificationService } from "../../notification/service/notification.service";
import { TransferDTO } from "../types/transaction.types";
import { WalletPair } from "../../wallet/types/wallet.types";
import { TransactionQueryDTO } from "../types/transaction.types";
import { NotFoundError } from "../../../shared/errors/NotFoundError";
import { AppError } from "../../../shared/errors/AppError";
import { generateReferenceNumber } from "../../../shared/utils/reference.utils";
import { walletCache } from "../../../shared/cache/wallet.cache";
import { tracer } from "../../../shared/telemetry/tracer";
import {
    SpanStatusCode
} from "@opentelemetry/api";
import { BusinessLogger } from "../../../shared/logger/business-logger";
import { transferCounter, transferDuration } from "../../../shared/metrics/metrics";



export class TransactionService {



    private async validateIdempotencyKey(idempotencyKey: string) {
        const existing =
            await new TransactionRepository().findByIdempotencyKey(idempotencyKey);

        if (existing) {
            throw new AppError(
                "Duplicate Transaction",
                409,
                "A transaction with the same idempotency key already exists"
            )
        }
    }

    private async generateReferenceNumber() {
        while (true) {
            const referenceNumber =
                generateReferenceNumber("TRANSFER");

            const existing =
                await new TransactionRepository().findByReferenceNumber(referenceNumber);

            if (!existing) {
                return referenceNumber;
            }
        }
    }

    private async validateWallets(
        userId: string,
        toWalletId: string
    ) {
        const fromWallet =
            await new WalletRepository().findByUserId(userId);

        if (!fromWallet) {
            throw new AppError(
                "Wallet not found",
                404,
                "The sender's wallet could not be found"
            );
        }

        const toWallet =
            await new WalletRepository().findWalletById(toWalletId);

        if (!toWallet) {
            throw new AppError(
                "Destination wallet not found",
                404,
                "The recipient's wallet could not be found"
            )
        }

        if (fromWallet.id === toWallet.id) {
            throw new AppError(
                "Cannot transfer to own wallet",
                400,
                "You cannot transfer funds to your own wallet"
            )
        }

        return {
            fromWallet,
            toWallet
        }
    }

    private async validateTransfer(
        balance: number,
        amount: number
    ) {

        if (amount <= 0) {

            throw new AppError(
                "Invalid amount",
                400,
                "INVALID_AMOUNT"
            );

        }

        if (balance < amount) {

            throw new AppError(
                "Insufficient balance",
                400,
                "INSUFFICIENT_BALANCE"
            );

        }

    }

    private async executeTransfer(
        wallets: WalletPair,
        dto: TransferDTO,
        referenceNumber: string
    ) {

        return tracer.startActiveSpan(
            "wallet.transfer",
            async (span) => {

                try {

                    span.setAttributes({
                        "transaction.type": "TRANSFER",
                        "transaction.reference": referenceNumber,
                        "transaction.idempotency_key": dto.idempotencyKey,

                        "wallet.sender": wallets.fromWallet.id,
                        "wallet.receiver": wallets.toWallet.id,

                        "user.sender": wallets.fromWallet.userId,
                        "user.receiver": wallets.toWallet.userId,

                        "transfer.amount": Number(dto.amount),
                        "transfer.currency": "IDR",
                    });

                    const result = await prisma.$transaction(

                        async (tx) => {

                            const amount = new Prisma.Decimal(dto.amount);

                            const feeResult =
                                feeService.calculateTranferFee(amount);

                            const fee = feeResult.fee;

                            if (wallets.fromWallet.id === wallets.toWallet.id) {
                                throw new AppError(
                                    "Cannot transfer to own wallet",
                                    400,
                                    "INVALID_TRANSFER"
                                );
                            }

                            if (wallets.fromWallet.isFrozen) {
                                throw new AppError(
                                    "Sender wallet is frozen",
                                    403,
                                    "WALLET_FROZEN"
                                );
                            }

                            if (wallets.toWallet.isFrozen) {
                                throw new AppError(
                                    "Receiver wallet is frozen",
                                    403,
                                    "WALLET_FROZEN"
                                );
                            }

                            if (
                                wallets.fromWallet.balance.lessThan(
                                    feeResult.totalDebit
                                )
                            ) {
                                throw new AppError(
                                    "Insufficient balance",
                                    400,
                                    "INSUFFICIENT_BALANCE"
                                );
                            }

                            const senderNewBalance =
                                wallets.fromWallet.balance.minus(
                                    feeResult.totalDebit
                                );

                            const receiverNewBalance =
                                wallets.toWallet.balance.plus(amount);

                            const transaction =
                                await transactionRepository.createTransaction(
                                    tx,
                                    {
                                        fromWalletId: wallets.fromWallet.id,
                                        toWalletId: wallets.toWallet.id,
                                        amount,
                                        fee,
                                        transactionType:
                                            TransactionType.TRANSFER,
                                        status:
                                            TransactionStatus.CREATED,
                                        description: dto.description,
                                        referenceNumber,
                                        idempotencyKey:
                                            dto.idempotencyKey,
                                    }
                                );

                            await transactionRepository.updateStatus(
                                transaction.id,
                                TransactionStatus.PROCESSING
                            );

                            const sender =
                                await walletRepository.updateBalance(
                                    tx,
                                    wallets.fromWallet.id,
                                    wallets.fromWallet.version,
                                    senderNewBalance
                                );

                            if (sender.count === 0) {
                                throw new AppError(
                                    "Wallet has been modified",
                                    409,
                                    "OPTIMISTIC_LOCKING_FAILURE"
                                );
                            }

                            const receiver =
                                await walletRepository.updateBalance(
                                    tx,
                                    wallets.toWallet.id,
                                    wallets.toWallet.version,
                                    receiverNewBalance
                                );

                            if (receiver.count === 0) {
                                throw new AppError(
                                    "Wallet modified",
                                    409,
                                    "OPTIMISTIC_LOCK_FAILED"
                                );
                            }

                            await ledgerRepository.createEntries(
                                tx,
                                [
                                    {
                                        transactionId: transaction.id,
                                        walletId: wallets.fromWallet.id,
                                        entryType: EntryType.DEBIT,
                                        amount,
                                        balanceAfter:
                                            senderNewBalance,
                                    },
                                    {
                                        transactionId: transaction.id,
                                        walletId: wallets.toWallet.id,
                                        entryType: EntryType.CREDIT,
                                        amount,
                                        balanceAfter:
                                            receiverNewBalance,
                                    },
                                ]
                            );

                            await transactionRepository.createLog(
                                tx,
                                {
                                    transactionId: transaction.id,
                                    event: "TRANSFER_COMPLETED",
                                    statusBefore:
                                        TransactionStatus.PROCESSING,
                                    statusAfter:
                                        TransactionStatus.SUCCESS,
                                }
                            );

                            await transactionRepository.completeTransaction(
                                tx,
                                transaction.id
                            );

                            await transactionRepository.updateStatus(
                                transaction.id,
                                TransactionStatus.SUCCESS
                            );
                            
                        //     if (process.env.ENABLE_EMAIL === "true") {
                        //     await notificationService.transferSuccess(
                        //         wallets.fromWallet.user.email,
                        //         {
                        //             receiver:
                        //                 wallets.toWallet.user.firstName ??
                        //                 wallets.toWallet.user.email,
                        //             amount: amount.toString(),
                        //             fee: fee.toString(),
                        //             currency: "IDR",
                        //             referenceNumber,
                        //             transactionTime: new Date(),
                        //         }
                        //     );
                        // }

                            span.setStatus({
                                code: 1, // OK
                            });

                            return transaction;
                        },

                        {
                            isolationLevel:
                                Prisma.TransactionIsolationLevel.Serializable,
                        }
                    );

                    return result;

                } catch (error) {

                    span.recordException(error as Error);

                    span.setStatus({
                        code: 2, // ERROR
                        message:
                            error instanceof Error
                                ? error.message
                                : "Unknown error",
                    });

                    throw error;

                } finally {

                    span.end();

                }

            }
        );

    }

    private async invalidateCache(
        fromWalletId: string,
        toWalletId: string
    ) {
        await walletCache.invalidateBalance(fromWalletId);
        await walletCache.invalidateBalance(toWalletId);
    }


    async transfer(
        userId: string,
        dto: TransferDTO
    ) {

        const timer = transferDuration.startTimer();

        try {

            BusinessLogger.info(
                "Transfer started",
                {
                    senderUserId: userId,
                    receiverWalletId: dto.toWalletId,
                    amount: dto.amount,
                }
            );

            await this.validateIdempotencyKey(
                dto.idempotencyKey
            );

            const referenceNumber =
                await this.generateReferenceNumber();

            BusinessLogger.info(
                "Reference number generated",
                {
                    referenceNumber,
                }
            );

            const wallet =
                await this.validateWallets(
                    userId,
                    dto.toWalletId
                );

            BusinessLogger.info(
                "Wallet validation completed",
                {
                    senderWalletId: wallet.fromWallet.id,
                    receiverWalletId: wallet.toWallet.id,
                }
            );

            await this.validateTransfer(
                wallet.fromWallet.balance.toNumber(),
                dto.amount
            );

            BusinessLogger.info(
                "Transfer validation completed"
            );

            const transaction =
                await this.executeTransfer(
                    wallet,
                    dto,
                    referenceNumber
                );

            BusinessLogger.info(
                "Transfer completed",
                {
                    transactionId: transaction.id,
                    referenceNumber,
                    senderWalletId: wallet.fromWallet.id,
                    receiverWalletId: wallet.toWallet.id,
                    amount: dto.amount,
                }
            );

            await this.invalidateCache(
                wallet.fromWallet.id,
                wallet.toWallet.id
            );

            BusinessLogger.info(
                "Wallet cache invalidated",
                {
                    senderWalletId: wallet.fromWallet.id,
                    receiverWalletId: wallet.toWallet.id,
                }
            );

            transferCounter.inc({
                status: "success",
            });

            return transaction;
        } catch (error) {
            transferCounter.inc({
                status: "failed",
            });

            throw error;
        } finally {
            timer();
        }
    } async getTransactions(
        userId: string,
        query: TransactionQueryDTO
    ) {
        const wallet =
            await new TransactionRepository().findWalletByUserId(userId);

        if (!wallet) {
            throw new NotFoundError('Wallet not found');
        }

        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        const result = await new TransactionRepository().findMany(
            wallet.id,
            page,
            limit,
            query.status,
            query.type
        )

        return {
            items: TransactionMapper.toList(result.items),
            pagination: {
                page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit)
            },
        };
    }

    async getTransactionDetail(
        userId: string,
        transactionId: string
    ) {
        const wallet = await new TransactionRepository().findWalletByUserId(userId);

        if (!wallet) {
            throw new NotFoundError('Wallet not found');
        }

        const transaction = await new TransactionRepository().findTransactionById(transactionId);

        if (!transaction) {
            throw new NotFoundError('Transaction not found');
        }

        const isOwner = transaction.fromWalletId === wallet.id || transaction.toWalletId === wallet.id;

        if (!isOwner) {
            throw new AppError(
                "Forbidden",
                403,
                "You do not have permission to access this transaction"
            );
        }

        return TransactionMapper.toDetail(transaction);
    }   
}

export const transactionService = new TransactionService();