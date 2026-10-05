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

    // Queue provider: 'bullmq' for persistent workers, 'qstash' for serverless
    QUEUE_PROVIDER: z.enum(['bullmq', 'qstash']).optional().default('bullmq'),

    // QStash configuration (required when QUEUE_PROVIDER=qstash)
    QSTASH_URL: z.string().url().optional(),
    QSTASH_TOKEN: z.string().optional(),
    QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
    QSTASH_NEXT_SIGNING_KEY: z.string().optional(),
    
    // Backend URL for QStash callbacks (required when QUEUE_PROVIDER=qstash)
    BACKEND_URL: z.string().url().optional(),
    
    // Frontend URL for CORS (production)
    FRONTEND_URL: z.string().url().optional(),
        
});

export const env = schema.parse(process.env);