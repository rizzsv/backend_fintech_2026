import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
    NODE_ENV: z.string(),

    // Database
    DATABASE_URL: z.string().url(),

    // App port (local dev only - Vercel ignores this)
    APP_PORT: z.string().default('3000'),

    // Redis (Upstash)
    REDIS_HOST: z.string(),
    REDIS_PORT: z.string(),
    REDIS_PASSWORD: z.string(),

    // JWT
    JWT_SECRET: z.string().min(32),

    // Logging
    LOG_LEVEL: z.string().default('info'),

    // SMTP (for OTP emails)
    SMTP_HOST: z.string(),
    SMTP_PORT: z.string(),
    SMTP_USER: z.string(),
    SMTP_PASS: z.string(),
    SMTP_FROM: z.string().email(),

    // Google OAuth
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_CALLBACK_URL: z.string().url(),

    // Midtrans (optional when PAYMENT_MODE=simulated)
    MIDTRANS_SERVER_KEY: z.string().optional(),
    MIDTRANS_CLIENT_KEY: z.string().optional(),
    MIDTRANS_BASE_URL: z.string().url().optional(),
    MIDTRANS_IS_PRODUCTION: z
        .string()
        .default("false")
        .transform((value) => value === "true"),

    // Payment mode: 'simulated' for portfolio/demo, 'production' for real payment
    PAYMENT_MODE: z.enum(['simulated', 'production']).default('simulated'),

    // Webhook secrets (optional - not used in simulated mode)
    WITHDRAWAL_WEBHOOK_SECRET: z.string().optional(),

    // Bull Board (optional - disabled in Vercel)
    BULL_BOARD_USERNAME: z.string().optional(),
    BULL_BOARD_PASSWORD: z.string().optional(),

    // Queue provider: 'bullmq' for persistent workers, 'qstash' for serverless
    QUEUE_PROVIDER: z.enum(['bullmq', 'qstash']).optional().default('bullmq'),

    // QStash configuration (optional - only if QUEUE_PROVIDER=qstash)
    QSTASH_URL: z.string().url().optional(),
    QSTASH_TOKEN: z.string().optional(),
    QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
    QSTASH_NEXT_SIGNING_KEY: z.string().optional(),
    
    // Backend URL for QStash callbacks and OAuth redirects
    BACKEND_URL: z.string().url().optional(),
    
    // Frontend URL for CORS and OAuth redirects
    FRONTEND_URL: z.string().url().optional(),
        
}).superRefine((data, ctx) => {
    // Validate Midtrans credentials when not in simulated mode
    if (data.PAYMENT_MODE !== 'simulated') {
        if (!data.MIDTRANS_SERVER_KEY) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "MIDTRANS_SERVER_KEY is required when PAYMENT_MODE is not 'simulated'",
                path: ['MIDTRANS_SERVER_KEY'],
            });
        }
        if (!data.MIDTRANS_CLIENT_KEY) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "MIDTRANS_CLIENT_KEY is required when PAYMENT_MODE is not 'simulated'",
                path: ['MIDTRANS_CLIENT_KEY'],
            });
        }
        if (!data.MIDTRANS_BASE_URL) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "MIDTRANS_BASE_URL is required when PAYMENT_MODE is not 'simulated'",
                path: ['MIDTRANS_BASE_URL'],
            });
        }
    }
});

export const env = schema.parse(process.env);