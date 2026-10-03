import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
    NODE_ENV: z.string(),

    APP_PORT: z.string(),

    REDIS_HOST: z.string(),
    REDIS_PORT: z.string(),
    REDIS_PASSWORD: z.string(),

    JWT_SECRET: z.string(),

    LOG_LEVEL: z.string(),

    MIDTRANS_SERVER_KEY: z.string(),

    MIDTRANS_CLIENT_KEY: z.string(),

    MIDTRANS_BASE_URL: z.string().url(),

    MIDTRANS_IS_PRODUCTION: z
        .string()
        .transform((value) => value === "true"),

    WITHDRAWAL_WEBHOOK_SECRET: z.string(),

    BULL_BOARD_USERNAME: z.string(),
    BULL_BOARD_PASSWORD: z.string(),

    // Payment mode: 'simulated' for portfolio/demo, 'production' for real payment
    PAYMENT_MODE: z.enum(['simulated', 'production']).default('simulated'),
        
});

export const env = schema.parse(process.env);