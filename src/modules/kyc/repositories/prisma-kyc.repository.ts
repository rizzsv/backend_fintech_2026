import { KycRequest, Prisma } from "@prisma/client";
import { KycRepository } from "./kyc.repository";
import { prisma } from "../../../shared/config/database";

export class PrismaKycRepository implements KycRepository {
    async findByUserId(
        userId: string,
        tx?: Prisma.TransactionClient
    ): Promise<KycRequest | null> {
        const db = tx ?? prisma

        return db.kycRequest.findFirst({
            where: {
                userId,
            },

            orderBy: {
                createdAt: "desc"
            }
        });
    }

    async findById(
        id: string,
        tx?: Prisma.TransactionClient
    ): Promise<KycRequest | null> {
        const db = tx ?? prisma

        return db.kycRequest.findUnique({
            where: {
                id,
            }
        });
    }

    async create(
        data: Prisma.KycRequestCreateInput,
        tx?: Prisma.TransactionClient
    ): Promise<KycRequest> {

        const db = tx ?? prisma;

        return db.kycRequest.create({
            data,
        });
    }

    async update(
        id: string,
        data: Prisma.KycRequestUpdateInput,
        tx?: Prisma.TransactionClient
    ): Promise<KycRequest> {
        const db = tx ?? prisma;

        return db.kycRequest.update({
            where: {
                id,
            },
            data,
        })
    }

    
}