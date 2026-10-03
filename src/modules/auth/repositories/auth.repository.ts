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

    async createRegistration(data: {
        email: string;
        phoneNumber: string;
        passwordHash: string;
        firstName?: string;
        lastName?: string;
        role: UserRole;
        verificationTokenHash: string | null;
        verificationExpiresAt: Date | null;
    }) {
        const {
            verificationTokenHash,
            verificationExpiresAt,
            ...userData
        } = data;

        return prisma.$transaction(async (tx) => {
            const user = await this.createUser(tx, userData);

            await this.createWallet(tx, user.id);
            await this.createUserLimit(tx, user.id);
            
            if (verificationTokenHash && verificationExpiresAt) {
                await this.updateVerificationTokenRegister(
                    tx,
                    user.id,
                    verificationTokenHash,
                    verificationExpiresAt
                );
            }

            return {
                id: user.id,
                email: user.email,
            };
        });
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
        const { generateAccountNumber } = await import('../../../shared/utils/account-number.utils.js');
        
        // Generate unique account number with collision retry
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            const accountNumber = generateAccountNumber();

            try {
                return await tx.wallet.create({
                    data: {
                        userId,
                        currency: 'IDR',
                        accountNumber,
                    },
                });
            } catch (error: any) {
                // P2002 = Unique constraint violation
                if (error.code === 'P2002' && error.meta?.target?.includes('account_number')) {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        throw new Error('Failed to generate unique account number after multiple attempts');
                    }
                    // Retry with new account number
                    continue;
                }
                // Other errors, rethrow
                throw error;
            }
        }

        throw new Error('Failed to create wallet: max account number generation attempts exceeded');
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
        data: {
            userId: string;
            refreshTokenHash: string;
            expiresAt: Date;
            deviceName?: string;
            deviceIp?: string;
            userAgent?: string;
        },
        tx?: Prisma.TransactionClient,
    ) {
        const client = tx ?? prisma;

        return client.session.create({
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
        })
    }

    async updateEmailVerificationStatus(userId: string, isVerified: boolean) {
        return prisma.user.update({
            where: { id: userId },
            data: {
                isEmailVerified: isVerified,
                emailVerificationToken: null,
                emailVerificationExpiresAt: null,
            },
        });
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