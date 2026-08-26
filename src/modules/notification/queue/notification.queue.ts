import { Queue } from "bullmq";

import { redis } from "../../../shared/config/redis";

import {
    NotificationJobData,
} from "../types/notification-job.types";


export const NOTIFICATION_QUEUE_NAME =
    "notification-queue";


export const NOTIFICATION_JOB =
    "send-notification";

export const NOTIFICATION_MAX_ATTEMPTS = 3;


export const notificationQueue =
    new Queue<NotificationJobData>(
        NOTIFICATION_QUEUE_NAME,
        {
            connection: redis,

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