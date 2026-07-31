import { redis } from "../config/redis";

export class IdempotencyService {
    private prefix = "idempotency:";

    async get(
        key: string
    ) {
        const data = await redis.get(
            this.prefix + key
        );

        if (!data) {
            return null;
        }

        return JSON.parse(data);
    }

    async set(
        key: string,
        response: any,
    ) {
        await redis.set(
            this.prefix + key,
            JSON.stringify(response),
            "EX",
            60 * 60 * 24
        )
    }
}

export const idempotencyService = new IdempotencyService();