import { Prisma } from "@prisma/client";
import { prisma } from "../../../shared/config/database";



export interface VelocityMetrics {
    transactionCount1m: number;
    transactionCount1h: number;
    amount1h: Prisma.Decimal;
    amount24h: Prisma.Decimal;
}

export class VelocityRepository {

    async getMetrics(
        userId: string,
        tx?: Prisma.TransactionClient
    ): Promise<VelocityMetrics> {

        const db = tx ?? prisma;

        const now = new Date();

        const oneMinuteAgo =
            new Date(
                now.getTime() - 60 * 1000
            );

        const oneHourAgo =
            new Date(
                now.getTime() - 60 * 60 * 1000
            );

        const oneDayAgo =
            new Date(
                now.getTime() - 24 * 60 * 60 * 1000
            );


        const [
            transactionCount1m,
            transactionCount1h,
            amount1h,
            amount24h,
        ] = await Promise.all([

            db.transaction.count({
                where: {
                    fromWallet: {
                        userId,
                    },

                    createdAt: {
                        gte: oneMinuteAgo,
                    },
                },
            }),


            db.transaction.count({
                where: {
                    fromWallet: {
                        userId,
                    },

                    createdAt: {
                        gte: oneHourAgo,
                    },
                },
            }),


            db.transaction.aggregate({
                where: {
                    fromWallet: {
                        userId,
                    },

                    createdAt: {
                        gte: oneHourAgo,
                    },
                },

                _sum: {
                    amount: true,
                },
            }),


            db.transaction.aggregate({
                where: {
                    fromWallet: {
                        userId,
                    },

                    createdAt: {
                        gte: oneDayAgo,
                    },
                },

                _sum: {
                    amount: true,
                },
            }),
        ]);


        return {
            transactionCount1m,

            transactionCount1h,

            amount1h:
                amount1h._sum.amount ??
                new Prisma.Decimal(0),

            amount24h:
                amount24h._sum.amount ??
                new Prisma.Decimal(0),
        };
    }
}

export const velocityRepository =
    new VelocityRepository();