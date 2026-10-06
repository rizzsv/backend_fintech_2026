import { z } from "zod";
import {
    TransactionStatus,
    TransactionType,
} from "@prisma/client";

export const transactionQuerySchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1),

    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20),

    search: z
        .string()
        .optional(),

    status: z
        .enum([
            "CREATED",
            "PENDING",
            "PROCESSING",
            "SUCCESS",
            "FAILED",
            "CANCELLED",
            "REVERSED",
        ])
        .optional(),

    type: z
        .enum([
            "TRANSFER",
            "TOPUP",
            "WITHDRAWAL",
            "REFUND",
        ])
        .optional(),
});

// Base transfer schema without idempotencyKey (for request body validation)
export const transferBodySchema = z.object({
    toWalletId: z.string().uuid().optional(),
    recipientAccountNumber: z.string().regex(/^[1-9][0-9]{9}$/, 'Invalid 10-digit account number').optional(),
    amount: z.number().positive(),
    description: z.string().max(255).optional(),
}).refine(
    (data) => data.toWalletId || data.recipientAccountNumber,
    { message: 'Either toWalletId or recipientAccountNumber must be provided' }
);

// Full transfer schema with idempotencyKey (for service layer)
export const transferSchema = z.object({
    toWalletId: z.string().uuid().optional(),
    recipientAccountNumber: z.string().regex(/^[1-9][0-9]{9}$/, 'Invalid 10-digit account number').optional(),
    amount: z.number().positive(),
    description: z.string().max(255).optional(),
    idempotencyKey: z.string().min(1).max(255),
}).refine(
    (data) => data.toWalletId || data.recipientAccountNumber,
    { message: 'Either toWalletId or recipientAccountNumber must be provided' }
)