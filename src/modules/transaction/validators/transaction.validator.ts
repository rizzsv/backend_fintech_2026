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

export const transferSchema = z.object({
    toWalletId: z.string().uuid(),
    amount: z.number().positive(),
    description: z.string().max(255).optional(),
    idempotencyKey: z.string().min(1).max(255),
})