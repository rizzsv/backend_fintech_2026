import { z } from "zod";

export const createPaymentSchema = z.object({
    amount: z
        .number()
        .min(1000)
        .max(10000000),

    paymentMethod: z.enum([
        "qris",
        "gopay",
        "bank_transfer",
        "shopeepay",
    ]),
});

export type CreatePaymentValidator =
    z.infer<typeof createPaymentSchema>;