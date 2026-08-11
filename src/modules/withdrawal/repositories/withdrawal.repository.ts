import { Prisma, withdrawalStatus, Withdrawal } from '@prisma/client';
import { prisma } from "../../../shared/config/database"
import { WITHDRAWAL_CONSTANTS } from '../constants/withdrawal.constants';

type Tx = Prisma.TransactionClient

export class WithdrawalRepository {
    async create(
        data: Prisma.WithdrawalCreateInput,
        tx: Tx
    ) {
        return tx.withdrawal.create({
            data,
        })
    }

    async findById(
        id: string,
        tx: Tx
    ) {
        return tx.withdrawal.findUnique({
            where: { id },
        })
    }

    async findByReference(
        referenceNumber: string,
        tx: Tx
    ) {
        return tx.withdrawal.findUnique({
            where: {
                referenceNumber
            }
        });
    }

    async findByUserId(
        userId: string,
        tx: Tx
    ): Promise<Withdrawal[]> {
        return tx.withdrawal.findMany({
            where: {
                userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
    }

    async findPending(
        tx: Tx
    ): Promise<Withdrawal[]> {
        return tx.withdrawal.findMany({
            where: {
                status: withdrawalStatus.PENDING
            },
            orderBy: {
                createdAt: 'asc'
            }
        })
    }

    async findStuckProcessing(
        minutes: number,
        tx: Tx
    ) {
        const limit = new Date(Date.now() - minutes * 60 * 1000);

        return tx.withdrawal.findMany({
            where: {
                status: withdrawalStatus.PROCESSING,
                createdAt: {
                    lt: limit
                }
            }
        })
    }

    async findProcessing(
        tx: Tx
    ): Promise<Withdrawal[]> {
        return tx.withdrawal.findMany({
            where: {
                status: withdrawalStatus.PROCESSING
            },
            orderBy: {
                createdAt: 'asc'
            }
        })
    }

    async findByIdempotencyKey(
        key: string,
        tx: Tx
    ) {
        return tx.withdrawal.findUnique({
            where: {
                idempotencyKey: key
            }
        })
    }

    async findLatestSuccess(
        userId: string,
        tx: Tx
    ) {
        return tx.withdrawal.findFirst({
            where: {
                userId,
                status: withdrawalStatus.SUCCESS
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
    }

    async updateStatus(
        id: string,
        status: withdrawalStatus,
        providerResponse:
            Prisma.InputJsonValue | typeof Prisma.JsonNull,
        tx: Tx
    ) {
        return tx.withdrawal.update({
            where: { id },
            data: {
                status,
                providerResponse
            }
        })
    }

    async markFailed(
        withdrawalId: string,
        reason: string,
        providerResponse: Prisma.InputJsonValue,
        tx: Tx
    ): Promise<Withdrawal> {
        return tx.withdrawal.update({
            where: { id: withdrawalId },
            data: {
                status: withdrawalStatus.FAILED,
                failedReason: reason,
                providerResponse
            }
        })
    }

    async delete(
        withdrawalId: string,
        tx: Tx
    ): Promise<Withdrawal> {
        return tx.withdrawal.delete({
            where: { id: withdrawalId }
        })
    }

    async getDailyTotal(
        userId: string,
        tx: Tx
    ) {

        const startOfDay =
            new Date();

        startOfDay.setHours(
            0,
            0,
            0,
            0
        );


        const result =
            await tx.withdrawal.aggregate({

                where: {

                    userId,

                    createdAt: {
                        gte: startOfDay,
                    },

                    status: {
                        in: [
                            "PENDING",
                            "PROCESSING",
                            "SUCCESS",
                        ],
                    },

                },

                _sum: {
                    amount: true,
                },

            });


        return (
            result._sum.amount ??
            new Prisma.Decimal(0)
        );
    }

    validateDailyLimit (
        total: Prisma.Decimal,
        amount: Prisma.Decimal
    ) {
        const after = total.plus(amount);

        if(
            after.greaterThan(
                WITHDRAWAL_CONSTANTS.DAILY_LIMIT
            )
        ) {
            throw new Error(
                "Daily withdrawal limit exceeded. Limit is " + WITHDRAWAL_CONSTANTS.DAILY_LIMIT
            )
        }
    }
}

export const withdrawalRepository = new WithdrawalRepository();