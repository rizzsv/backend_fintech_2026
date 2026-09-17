import {
    Prisma,
    TransactionStatus,
    TransactionType,
    Wallet,
} from "@prisma/client";

export interface TransactionQueryDTO {
    page?: number;
    limit?: number;
    search?: string;
    status?: TransactionStatus;
    type?: TransactionType;
}

export interface TransferDTO {
    toWalletId: string;
    amount: number;
    description?: string;
    idempotencyKey: string;
}

export interface TransactionResponse {
    id: string;
    referenceNumber: string;
    status: string;
    amount: number;
    fee: number;
    createdAt: Date;
}

export interface CreateTransactionRepositoryDTO {
    fromWalletId: string;
    toWalletId: string;
    amount: Prisma.Decimal;
    fee: Prisma.Decimal;
    transactionType: TransactionType;
    status: TransactionStatus;
    description?: string;
    referenceNumber: string;
    idempotencyKey: string;
}

export interface WalletPair {
    fromWallet: Wallet;
    toWallet: Wallet;
}