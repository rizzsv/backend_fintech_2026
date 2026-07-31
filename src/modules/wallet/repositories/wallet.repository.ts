import { PaymentStatus, Prisma } from '@prisma/client';
import {prisma} from '../../../shared/config/database'

type Tx = Prisma.TransactionClient;

export class WalletRepository {
    async findByUserId(userId: string, tx?: Tx) {

        const db = tx ?? prisma;

        return db.wallet.findFirst({
            where: {
                userId,
                currency: 'IDR'
            },
            include: {
                user: true
            }
        });
    }

        async findById(
        walletId: string,
        tx?: Prisma.TransactionClient
    ) {

        const db = tx ?? prisma;

        return db.wallet.findUnique({
            where: {
                id: walletId
            }
        });

    }

        async create(
        data: Prisma.WalletCreateInput,
        tx?: Prisma.TransactionClient
    ) {

        const db = tx ?? prisma;

        return db.wallet.create({
            data
        });

    }

    async credit(
        walletId: string,
        amount: Prisma.Decimal | number,
        version: number,
        tx: Prisma.TransactionClient = prisma
    ) {
        return tx.wallet.updateMany({
            where: {
              id: walletId,
                version,  
            },
            data: {
                balance: {
                    increment: amount
                },
                version: {
                    increment: 1
                }
            }
        })
    }

     async updateBalanceWithVersion(
        walletId: string,
        currentVersion: number,
        amount: number,
        tx: Prisma.TransactionClient
    ) {

        return tx.wallet.updateMany({

            where: {

                id: walletId,

                version: currentVersion,

                isFrozen: false

            },

            data: {

                balance: {

                    increment: amount

                },

                version: {

                    increment: 1

                }

            }

        });

    }

    async updateBalanceOptimistic(
        tx: Prisma.TransactionClient,
        walletId: string,
        version: number,
        amount: Prisma.Decimal
    ){
        return tx.wallet.updateMany({
            where: {
                id: walletId,
                version,
            },
            data: {
                balance: {
                    increment: amount
                },
                version: {
                    increment: 1
                }
            }
        })
    }

    async incrementBalance(
        tx: Prisma.TransactionClient,
        walletId: string,
        amount: Prisma.Decimal
    ) {
        return tx.wallet.update({
            where: {
                id: walletId
            },
            data: {
                balance: {
                    increment: amount
                }
            }
        })
    }

    async updateBalance(
        tx: Prisma.TransactionClient,
        walletId: string,
        version: number,
        amount: Prisma.Decimal
    ) {
        return tx.wallet.updateMany({
            where: {
                id: walletId,
                version
            },
            data: {
                balance: {
                    increment: amount
                },
                version: {
                    increment: 1
                }
            },
        });
    }

    async updatePaid(
        tx: Prisma.TransactionClient,
        referenceNumber: string,
        externalReference: string,
        providerResponse: Prisma.InputJsonValue
    ) {
        return tx.payment.update({
            where: {
                referenceNumber
            },
            data: {
                status: PaymentStatus.SUCCESS,
                paidAt: new Date(),
                externalReference,
                providerResponse: JSON.parse(
                    JSON.stringify(providerResponse)
                )
            }
        })
    }

    async updateCancelled(
        tx: Prisma.TransactionClient,
        referenceNumber: string
    ) {
        return tx.payment.update({
            where: {
                referenceNumber
            },
            data: {
                status: PaymentStatus.FAILED
            }
        })
    }

    async updateFailed(
        tx: Prisma.TransactionClient,
        referenceNumber: string,
        providerResponse: Prisma.InputJsonValue
    ) {
        return tx.payment.update({
            where: {
                referenceNumber
            },
            data: {
                status: PaymentStatus.FAILED,
                providerResponse: JSON.parse(
                    JSON.stringify(providerResponse)
                ),
            },
        })
    }

    async findUserLimit(userId: string) {
        return prisma.userLimit.findUnique({
            where: {
                userId
            }
        })
    }

    async getUserLimits(userId: string) {
        return prisma.userLimit.findUnique({
            where: {
                userId
            }
        });
    }

    async getWalletWithUser(userId: string) {
        return prisma.wallet.findUnique({
            where: {
                userId_currency: {
                    userId,
                    currency: 'IDR'
                }
            },
            include : {
                user : {
                    select : {
                    id : true,
                    email : true,
                    firstName : true,
                    lastName : true,
                    kycStatus : true,
                    kycTier : true
                    }
                }
            }
        })
    }

    async getLedger(
        walletId: string,
        page: number,
        limit: number
    ) {
        const skip = (page - 1) * limit;

        const [items, total] = 
        await Promise.all([
            prisma.ledgerEntry.findMany({
                where: {
                    walletId
                },

                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit
            }),
            prisma.ledgerEntry.count({
                where: {
                    walletId
                }
            })
        ]);

        return {
            items,
            total,
        }
    }

    async findWalletById(walletId: string) {
    return prisma.wallet.findUnique({
        where: {
            id: walletId,
        },
        include: {
            user: true,
        },
    });
}

    async increaseBalance(
        walletId: string,
        amount: Prisma.Decimal | number,
        tx?: Prisma.TransactionClient
    ) {

        const executor = tx ?? prisma;

        return executor.wallet.update({
            where: {
                id: walletId,
            },
            data: {
                balance: {
                    increment: amount,
                },
                version: {
                    increment: 1,
                },
            },
        });

    }

    async decreaseBalance(
        walletId: string,
        amount: Prisma.Decimal | number,
        tx?: Prisma.TransactionClient
    ) {

        const executor = tx ?? prisma;

        return executor.wallet.update({
            where: {
                id: walletId,
            },
            data: {
                balance: {
                    decrement: amount,
                },
                version: {
                    increment: 1,
                },
            },
        });

    }

}

export const walletRepository = new WalletRepository();