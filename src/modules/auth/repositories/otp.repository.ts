import { OtpCode, OtpPurpose, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../../shared/config/database";

export class OtpRepository {
    constructor(
        private readonly prisma: PrismaClient
    ){}

    async create(
        data: Prisma.OtpCodeCreateInput,
        tx?: Prisma.TransactionClient
    ): Promise<OtpCode> {
        const db = tx ?? this.prisma;

        return db.otpCode.create({
            data,
        });
    }

    async findActive(
        userId: string,
        purpose: OtpPurpose,
        tx?: Prisma.TransactionClient
    ): Promise<OtpCode | null> {
        const db = tx ?? this.prisma;

        return db.otpCode.findFirst({
            where: {
                userId,
                purpose,
                usedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
                attempts: {
                    lt: 5,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    async incrementAttempts(
        otpId: string,
        tx?: Prisma.TransactionClient
    ): Promise<OtpCode>{
        const db = tx ?? this.prisma;

        return db.otpCode.update({
            where: {
                id: otpId,
            },
            data: {
                attempts: {
                    increment: 1,
                },
            },
        });
    }

    async markUsed(
        otpId: string,
        tx?: Prisma.TransactionClient
    ): Promise<OtpCode> {
        const db = tx ?? this.prisma;

        return db.otpCode.update({
            where: {
                id: otpId,
            },
            data: {
                usedAt: new Date(),
            },
        });
    }

    async invalidateActive(
        userId: string,
        purpose: OtpPurpose,
        tx?: Prisma.TransactionClient
    ): Promise<Prisma.BatchPayload> {
        const db = tx ?? this.prisma;

        return db.otpCode.updateMany({
            where: {
                userId,
                purpose,
                usedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
            data: {
                usedAt: new Date(),
            }
        })
    }
}

export const otpRepository = new OtpRepository(prisma);