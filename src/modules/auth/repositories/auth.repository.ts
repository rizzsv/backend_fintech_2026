import {Prisma, TransactionStatus, User, UserRole} from '@prisma/client';
import {prisma} from '../../../shared/config/database'

export class AuthRepository {
    async findByEmail(email: string) {
        return prisma.user.findUnique({
            where: {email}
        })
    }

    async findByPhoneNumber(phoneNumber: string) {
        return prisma.user.findUnique({
            where: {phoneNumber}
        })
    }

    async createUser(
        tx: Prisma.TransactionClient,
        data: {
            email: string;
            phoneNumber: string;
            passwordHash: string;
            firstName?: string;
            lastName?: string;
            role?: UserRole;
        }
    ) {
        return tx.user.create({
            data,
        })
    }

    async createWallet(
        tx: Prisma.TransactionClient,
        userId: string
    ) {
        return tx.wallet.create({
            data: {
                userId,
                currency: 'IDR',
            },
        });
    }

    async createUserLimit(
        tx: Prisma.TransactionClient,
        userId: string
    ) {
        return tx.userLimit.create({
            data: {
                userId,

                dailyLimit: 10000000,
                monthlyLimit: 50000000,
            },
        });
    }

    async createSession(
        tx: Prisma.TransactionClient,
        data: {
            userId: string;
            refreshTokenHash: string;
            expiresAt: Date;
            deviceName?: string;
            deviceIp?: string;
            userAgent?: string;
        }
    ) {
        return tx.session.create({
            data,
        });
    }

    async findSessionByRefreshHash(
        refreshTokenHash: string
    ) {
        return prisma.session.findFirst({
            where: {
                refreshTokenHash,
                isActive: true
            },
        });
    }

    async deactivateSession(sessionId: string) {
        return prisma.session.update({
            where: {id: sessionId},
            data: {isActive: false}
        });
    }

    async deactiveAllUserSessions(
        userId: string
    ) {
        return prisma.session.updateMany({
            where: {
                userId,
                isActive: true
            },
            data: {
                isActive: false
            }
        })
    }

    async findActiveSession(
        refreshTokenHash: string
    ) {
        return prisma.session.findFirst({
            where: {
                refreshTokenHash,
                isActive: true
            },
        });
    }

    async findSessionByHash(
        refreshTokenHash: string
    ) {
        return prisma.session.findFirst({
            where: {
                refreshTokenHash,
                isActive: true
            },
        });
    }

    async updateSession(
        sessionId: string,
        refreshTokenHash: string,
        expiresAt: Date
    ) {
        return prisma.session.update({
            where: {
                id: sessionId
            },
            data: {
                refreshTokenHash,
                expiresAt,
                lastActivity: new Date()
            }
        })
    }

    async findSessionById(sessionId: string) {
        return prisma.session.findFirst({
            where: {
                id: sessionId,
                isActive: true
            }
        })
    }

    async findById(id: string) {
        return prisma.user.findUnique({
            where: {id},

            include : {
                wallet: true,
                userLimit: true
            }
        })
    }

async updateVerificationTokenRegister(
  tx: Prisma.TransactionClient,
  userId: string,
  tokenHash: string,
  expiresAt: Date
) {
return tx.user.update({
    where: {
        id: userId,
    },
    data: {
        emailVerificationToken: tokenHash,
        emailVerificationExpiresAt: expiresAt,
    },
});
}

async updateVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
) {
    return prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            emailVerificationToken: tokenHash,
            emailVerificationExpiresAt: expiresAt,
        },
    });
}
}

export const authRepository = new AuthRepository();