import { prisma } from '../../../shared/config/database';
import { Prisma } from '@prisma/client';

export class OAuthRepository {
    async findByProviderAccount(provider: string, providerAccountId: string) {
        return prisma.oAuthAccount.findUnique({
            where: {
                provider_providerAccountId: {
                    provider,
                    providerAccountId,
                },
            },
            include: {
                user: true,
            },
        });
    }

    async findByUserId(userId: string, provider: string) {
        return prisma.oAuthAccount.findFirst({
            where: {
                userId,
                provider,
            },
        });
    }

    async create(
        data: {
            userId: string;
            provider: string;
            providerAccountId: string;
            email?: string;
        },
        tx?: Prisma.TransactionClient
    ) {
        const client = tx ?? prisma;
        return client.oAuthAccount.create({
            data,
        });
    }

    async updateEmail(
        id: string,
        email: string,
        tx?: Prisma.TransactionClient
    ) {
        const client = tx ?? prisma;
        return client.oAuthAccount.update({
            where: { id },
            data: { email },
        });
    }
}

export const oauthRepository = new OAuthRepository();
