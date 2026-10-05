import { Queue } from "bullmq";
import { env } from "../../../shared/config/env";
import { NotificationJobData } from "../types/notification-job.types";
import { logger } from "../../../shared/logger/logger";

export const NOTIFICATION_DLQ_NAME = 'notification-dlq';
export const NOTIFICATION_DLQ_JOB = 'failed-notification-job';

let _notificationDLQ: Queue<NotificationJobData> | null = null;

function getNotificationDLQ(): Queue<NotificationJobData> | null {
    if (env.QUEUE_PROVIDER !== 'bullmq') {
        return null;
    }

    if (!_notificationDLQ) {
        const { redisConnection } = require("../../../shared/queue/bullmq");
        _notificationDLQ = new Queue<NotificationJobData>(
            NOTIFICATION_DLQ_NAME,
            {
                connection: redisConnection,
                defaultJobOptions: {
                    removeOnComplete: {
                        age: 60 * 60 * 24,
                        count: 5000,
                    },
                    removeOnFail: {
                        age: 60 * 60 * 24 * 7,
                        count: 10000,
                    }
                }
            }
        );
    }

    return _notificationDLQ;
}

export const notificationDLQ = {
    add: async (
        jobName: string,
        data: NotificationJobData,
        opts?: { jobId?: string }
    ) => {
        const queue = getNotificationDLQ();
        if (!queue) {
            logger.info({ jobName, data, msg: "DLQ add skipped (serverless)" });
            return null;
        }
        return queue.add(jobName, data, opts);
    }
};
