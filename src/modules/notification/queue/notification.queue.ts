import { Queue } from "bullmq";
import { env } from "../../../shared/config/env";
import { NotificationJobData } from "../types/notification-job.types";
import { logger } from "../../../shared/logger/logger";

export const NOTIFICATION_QUEUE_NAME = "notification-queue";
export const NOTIFICATION_JOB = "send-notification";
export const NOTIFICATION_MAX_ATTEMPTS = 3;

/**
 * Notification queue - only initialized when QUEUE_PROVIDER=bullmq
 * In serverless (Vercel) without BullMQ, notifications are persisted to DB
 * but async processing (email/push) is skipped.
 */
let _notificationQueue: Queue<NotificationJobData> | null = null;

function getNotificationQueue(): Queue<NotificationJobData> | null {
    if (env.QUEUE_PROVIDER !== 'bullmq') {
        return null;
    }

    if (!_notificationQueue) {
        // Lazy import to avoid connection at module load
        const { redisConnection } = require("../../../shared/queue/bullmq");
        _notificationQueue = new Queue<NotificationJobData>(
            NOTIFICATION_QUEUE_NAME,
            {
                connection: redisConnection,
                defaultJobOptions: {
                    attempts: NOTIFICATION_MAX_ATTEMPTS,
                    backoff: {
                        type: "exponential",
                        delay: 2000,
                    },
                    removeOnComplete: {
                        age: 60 * 60,
                        count: 1000,
                    },
                    removeOnFail: {
                        age: 60 * 60 * 24,
                        count: 5000,
                    },
                },
            }
        );
    }

    return _notificationQueue;
}

/**
 * Add notification job to queue (non-blocking, best-effort)
 * Returns true if queued, false if skipped/failed
 */
export async function addNotificationJob(
    notificationId: string
): Promise<boolean> {
    const queue = getNotificationQueue();
    
    if (!queue) {
        logger.info({
            notificationId,
            msg: "Notification queue skipped (no BullMQ in serverless mode)"
        });
        return false;
    }

    try {
        await queue.add(
            NOTIFICATION_JOB,
            { notificationId },
            { jobId: `notification:${notificationId}` }
        );
        return true;
    } catch (error) {
        logger.error({
            notificationId,
            error: error instanceof Error ? error.message : String(error),
            msg: "Failed to add notification to queue"
        });
        return false;
    }
}

// Legacy export for backwards compatibility (workers)
export const notificationQueue = {
    add: async (
        jobName: string,
        data: NotificationJobData,
        opts?: { jobId?: string }
    ) => {
        const queue = getNotificationQueue();
        if (!queue) {
            logger.info({ jobName, data, msg: "Queue add skipped (serverless)" });
            return null;
        }
        return queue.add(jobName, data, opts);
    }
};
