import { Queue } from "bullmq";
import { NotificationJobData } from "../types/notification-job.types";
import { redisConnection } from "../../../shared/queue/bullmq";

export const NOTIFICATION_DLQ_NAME = 'notification-dlq';

export const NOTIFICATION_DLQ_JOB = 'failed-notification-job';

export const notificationDLQ = 
   new Queue<NotificationJobData>(
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
   )