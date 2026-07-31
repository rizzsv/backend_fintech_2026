import {
    Prisma,
    TransactionLog,
} from "@prisma/client";

type Tx = Prisma.TransactionClient;

export class TransactionLogRepository {

    async create(

        data: Prisma.TransactionLogCreateInput,

        tx: Tx

    ): Promise<TransactionLog> {

        return tx.transactionLog.create({
            data,
        });

    }

}

export const transactionLogRepository =
new TransactionLogRepository();