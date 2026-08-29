import { KycRequest, Prisma } from "@prisma/client";

export interface KycRepository {
    findByUserId(
        userId: string,
        tx?: Prisma.TransactionClient
    ): Promise<KycRequest | null>;

    findById(
        id: string,
        tx?: Prisma.TransactionClient
    ): Promise<KycRequest | null>;

    create(
        data: Prisma.KycRequestCreateInput,
        tx?: Prisma.TransactionClient
    ): Promise<KycRequest>;

    update(
        id: string,
        data: Prisma.KycRequestUpdateInput,
        tx?: Prisma.TransactionClient
    ): Promise<KycRequest>
}