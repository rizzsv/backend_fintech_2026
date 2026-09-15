import {
    Prisma,
    LedgerEntry,
    PrismaClient,
} from "@prisma/client";

type Tx = Prisma.TransactionClient;

export class LedgerRepository {

    async createEntries(
        tx: Tx,
        entries: Prisma.LedgerEntryCreateManyInput[]
    ) {
        return tx.ledgerEntry.createMany({
            data: entries,
        });
    }

    async create(
        data: Prisma.LedgerEntryCreateInput,
        tx: Tx
    ): Promise<LedgerEntry> {
        return tx.ledgerEntry.create({
            data,
        });
    }

    async createMany(
        data: Prisma.LedgerEntryCreateManyInput[],
        tx: Tx
    ) {
        return tx.ledgerEntry.createMany({
            data,
        });
    }

    async findTransaction(
        transactionId: string,
    ) {
        const prisma = new PrismaClient();

        return prisma.ledgerEntry.findMany({
            where: {
                transactionId,
            },
            orderBy: {
                createdAt: "asc",
            },
        });
    }
}

export const ledgerRepository = new LedgerRepository();