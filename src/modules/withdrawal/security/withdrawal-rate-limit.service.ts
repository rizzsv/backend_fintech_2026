import {redis} from "../../../shared/config/redis";

export class WithdrawalRateLimitService {
    async check(
        userId: string
    ) {
        const key = `withdrawal-rate-limit:${userId}`;

        const count = await redis.incr(key);
        if (count === 1) {
            await redis.expire(key, 3600);
        }

        if (count > 5) {
            throw new Error("Rate limit exceeded. Please try again later.");
        }
    }
}

export const withdrawalRateLimitService = new WithdrawalRateLimitService();