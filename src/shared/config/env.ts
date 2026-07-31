import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
    NODE_ENV: z.string(),

    APP_PORT: z.string(),

    DB_HOST: z.string(),
    DB_PORT: z.string(),
    DB_NAME: z.string(),
    DB_USER: z.string(),
    DB_PASSWORD: z.string(),

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

    BULL_BOARD_USERNAME: z.string(),
    BULL_BOARD_PASSWORD: z.string(),
        
});

export const env = schema.parse(process.env);