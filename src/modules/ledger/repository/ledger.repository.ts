import {PrismaClient, Prisma, LedgerEntry} from '@prisma/client'
import { DefaultArgs } from '@prisma/client/runtime/library';

type Tx = Prisma.TransactionClient;

const prisma = new PrismaClient()

export class LedgerRepository {
    createEntries(tx: Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">, arg1: ({ transactionId: string; walletId: string; entryType: "DEBIT"; amount: Prisma.Decimal; balanceAfter: Prisma.Decimal; } | { transactionId: string; walletId: string; entryType: "CREDIT"; amount: Prisma.Decimal; balanceAfter: Prisma.Decimal; })[]) {
        throw new Error("Method not implemented.");
    }
    async create(
        data: Prisma.LedgerEntryCreateInput,
        tx: Tx
    ): Promise<LedgerEntry> {
        return tx.ledgerEntry.create({
            data,
        })
    }

    async createMany(
        data: Prisma.LedgerEntryCreateManyInput[],
        tx: Tx
    ) {
        const db = tx ?? prisma;
        return db.ledgerEntry.createMany({
            data,
        })
    }

    async findTransaction(
        TransactionId: string,
    ) {
        return prisma.ledgerEntry.findMany({
            where: {
                transactionId: TransactionId
            },
            orderBy: {
                createdAt: 'asc'
            }
        })
    }
}

export const ledgerRepository = new LedgerRepository();