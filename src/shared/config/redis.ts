import { Redis as UpstashRedis } from "@upstash/redis";
import { env } from "./env";
import { logger } from "../logger/logger";

/**
 * Upstash Redis REST client wrapper
 * Provides ioredis-compatible interface for existing code
 */
class RedisWrapper {
    private client: UpstashRedis;

    constructor() {
        if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
            throw new Error(
                "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required"
            );
        }

        this.client = new UpstashRedis({
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN,
        });

        logger.info("Redis REST client initialized");
    }

    /**
     * GET key
     */
    async get(key: string): Promise<string | null> {
        const result = await this.client.get<string>(key);
        return result;
    }

    /**
     * SET key value [EX seconds] [NX]
     * ioredis-compatible signature
     */
    async set(
        key: string,
        value: string,
        ...args: (string | number)[]
    ): Promise<string | null> {
        let ex: number | undefined;
        let nx = false;

        // Parse ioredis-style arguments: "EX", ttl, "NX"
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (typeof arg === "string" && arg.toUpperCase() === "EX") {
                ex = Number(args[i + 1]);
                i++;
            } else if (typeof arg === "string" && arg.toUpperCase() === "NX") {
                nx = true;
            }
        }

        let result: string | null;
        if (ex !== undefined && nx) {
            result = await this.client.set(key, value, { ex, nx: true });
        } else if (ex !== undefined) {
            result = await this.client.set(key, value, { ex });
        } else if (nx) {
            result = await this.client.set(key, value, { nx: true });
        } else {
            result = await this.client.set(key, value);
        }
        return result;
    }

    /**
     * SETEX key seconds value
     */
    async setex(key: string, seconds: number, value: string): Promise<string> {
        await this.client.setex(key, seconds, value);
        return "OK";
    }

    /**
     * DEL key [key ...]
     */
    async del(...keys: string[]): Promise<number> {
        if (keys.length === 0) return 0;
        const result = await this.client.del(...keys);
        return result;
    }

    /**
     * EXISTS key
     */
    async exists(key: string): Promise<number> {
        const result = await this.client.exists(key);
        return result;
    }

    /**
     * INCR key
     */
    async incr(key: string): Promise<number> {
        const result = await this.client.incr(key);
        return result;
    }

    /**
     * EXPIRE key seconds
     */
    async expire(key: string, seconds: number): Promise<number> {
        const result = await this.client.expire(key, seconds);
        return result;
    }

    /**
     * KEYS pattern
     */
    async keys(pattern: string): Promise<string[]> {
        const result = await this.client.keys(pattern);
        return result;
    }

    /**
     * PING - for health checks
     */
    async ping(): Promise<string> {
        const result = await this.client.ping();
        return result;
    }

    /**
     * No-op for REST client (no persistent connection)
     */
    async quit(): Promise<void> {
        // REST client doesn't maintain persistent connections
    }

    /**
     * No-op for REST client
     */
    async disconnect(): Promise<void> {
        // REST client doesn't maintain persistent connections
    }
}

export const redis = new RedisWrapper();
