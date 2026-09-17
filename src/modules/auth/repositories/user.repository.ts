import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../../shared/config/database";

export class UserRepository {
    async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
        });
    }

    async findByIdForDashboard(id: string) {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                isActive: true,
                isEmailVerified: true,
                kycStatus: true,
                kycTier: true,
                has2FA: true,
            },
        });
    }

    async findRoleById(userId: string): Promise<UserRole | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        return user?.role ?? null;
    }

    async updateRole(
        userId: string,
        role: UserRole,
        tx?: Prisma.TransactionClient
    ) {
        const client = tx ?? prisma;

        return client.user.update({
            where: { id: userId },
            data: { role },
        });
    }

    async enable2FA(
        userId: string,
        method: "email" | 'sms',
        tx?: Prisma.TransactionClient
    ){
        const db = tx ?? prisma;

        return db.user.update({
            where: {
                id: userId,
            },
            data: {
                has2FA: true,
                twoFactorMethod: method,
            },
        });
    }

    async findByEmailVerificationToken(tokenHash: string) {
        return prisma.user.findFirst({
            where: {
                emailVerificationToken: tokenHash,
            },
        });
    }

    async consumeEmailVerificationToken(tokenHash: string, now: Date) {
        return prisma.user.updateMany({
            where: {
                emailVerificationToken: tokenHash,
                emailVerificationExpiresAt: { gt: now },
                isEmailVerified: false,
            },
            data: {
                isEmailVerified: true,
                emailVerificationToken: null,
                emailVerificationExpiresAt: null,
            },
        });
    }
}

export const userRepository = new UserRepository();
