import { redis } from "../../../shared/config/redis";
import { BusinessLogger } from "../../../shared/logger/business-logger";

const WINDOW_SECONDS = 60;

const MAX_NOTIFICATIONS_PER_WINDOW = 10;

export class NotificationRateLimitService {
    async check(
        userId: string,
        type: string,
    ): Promise<boolean> {
        const key = `notification-rate-limit:${userId}:${type}`;

        const count = await redis.incr(key);

        if (count === 1) {
            await redis.expire(
                key,
                WINDOW_SECONDS
            );
        }

        if (count > MAX_NOTIFICATIONS_PER_WINDOW) {
            BusinessLogger.warn(
                "Notification rate limit exceeded for userId: ${userId}, type: ${type}",
                {
                    userId,
                    type,
                    count,
                    limit: MAX_NOTIFICATIONS_PER_WINDOW,
                }
            );

            return false;
        }

        return true;
    } 
}

export const notificationRateLimitService = new NotificationRateLimitService();