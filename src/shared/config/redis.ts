import Redis from "ioredis";
import {env} from "./env";
import { logger } from "../logger/logger";


export const redis = new Redis({
    host: env.REDIS_HOST,
    port: Number(env.REDIS_PORT),
    password: env.REDIS_PASSWORD,
    lazyConnect: true,
    maxRetriesPerRequest: 3
});

redis.on("connect", () => {
    logger.info("Redis connected");
});

redis.on("error", (err) => {
    logger.error("Redis error");
});