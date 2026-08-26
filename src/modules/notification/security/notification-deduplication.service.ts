import { redis } from "../../../shared/config/redis";

const DEDUPLICATION_TTL = 60;

export class NotificationDeduplicationService {
    async isDuplicate(
        userId: string,
        type: string,
        channel: string,
        resource?: string,
        entityId?: string
    ): Promise<boolean> {
        const key = 
        [
            "notification:dedup",
            userId,
            type,
            channel,
            resource ?? "none",
            entityId ?? "none"
        ].join(":");

        const result = await redis.set(
            key,
            "1",
            "EX",
            DEDUPLICATION_TTL,
            "NX"
        );

        return result === null;
    }
}

export const notificationDeduplicationService = new NotificationDeduplicationService();