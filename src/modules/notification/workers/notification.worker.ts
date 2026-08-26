import {
    Worker,
    Job,
} from "bullmq";

import {
    NotificationStatus,
} from "@prisma/client";

import {
    BusinessLogger,
} from "../../../shared/logger/business-logger";

import {
    notificationRepository,
} from "../repositories/notification.repository";

import {
    NotificationJobData,
} from "../types/notification-job.types";

import {
    NOTIFICATION_MAX_ATTEMPTS,
    NOTIFICATION_QUEUE_NAME,
} from "../queue/notification.queue";

import {
    notificationDeliveryService,
} from "../service/notification.delivery.service";

import {
    redisConnection,
} from "../../../shared/queue/bullmq";
import { NOTIFICATION_DLQ_JOB, notificationDLQ } from "../queue/notification-dlq.queue";

import {
    notificationDeliveryDuration,
    notificationDLQCounter,
    notificationFailedCounter,
    notificationRetryCounter,
} from "../observability/notification.metrics";
import { tracer } from "../../../shared/telemetry/tracer";


const CONCURRENCY =
    Number(
        process.env.NOTIFICATION_WORKER_CONCURRENCY ?? 5
    );


export const notificationWorker =
    new Worker<NotificationJobData>(

        NOTIFICATION_QUEUE_NAME,

        async (
            job: Job<NotificationJobData>
        ) => {

            const {
                notificationId,
            } = job.data;


            BusinessLogger.info(
                "Notification job started",
                {
                    jobId: job.id,
                    notificationId,
                    attempt: job.attemptsMade + 1,
                }
            );


            const notification =
                await notificationRepository.findById(
                    notificationId
                );


            if (!notification) {

                throw new Error(
                    `Notification ${notificationId} not found`
                );

            }


            /**
             * Idempotency
             *
             * Jika notification sudah berhasil
             * dikirim, jangan kirim ulang.
             */
            if (
                notification.status ===
                NotificationStatus.SENT
            ) {

                BusinessLogger.info(
                    "Notification already sent",
                    {
                        notificationId,
                    }
                );

                return;
            }


            /**
             * Mark as PROCESSING
             */
            await notificationRepository.markProcessing(
                notificationId
            );

            const timer = notificationDeliveryDuration.startTimer({
                type: notification.type,
                channel: notification.channel,
            })

            const deliverySpan = tracer.startSpan("notification.delivery");
            deliverySpan.setAttribute("notification.type", notification.type);
            deliverySpan.setAttribute("notification.channel", notification.channel);

            try {

                /**
                 * Delivery
                 */
                await notificationDeliveryService.deliver(
                    notification
                );


                /**
                 * Mark as SENT
                 */
                await notificationRepository.updateStatus(
                    notificationId,
                    NotificationStatus.SENT
                );

                notificationRepository.updateStatus(
                    notification.id,
                    NotificationStatus.SENT
                )


                BusinessLogger.info(
                    "Notification sent successfully",
                    {
                        notificationId,
                        channel: notification.channel,
                    }
                );

                return {
                    success: true,
                }


            } catch (error) {

                notificationFailedCounter.inc({
                    type: notification.type,
                    channel: notification.channel,
                });

                const reason =
                    error instanceof Error
                        ? error.message
                        : "Unknown notification error";


                /**
                 * Increment retry counter
                 */
                await notificationRepository.incrementRetry(
                    notificationId
                );


                /**
                 * Mark as FAILED
                 */
                await notificationRepository.updateStatus(
                    notificationId,

                    NotificationStatus.FAILED,

                    {
                        failedReason: reason,
                    }
                );


                BusinessLogger.error(
                    "Notification delivery failed",
                    {
                        notificationId,
                        channel: notification.channel,
                        error: reason,
                        attempt: job.attemptsMade + 1,
                    }
                );


                /**
                 * Throw kembali supaya BullMQ
                 * mengetahui bahwa job gagal.
                 *
                 * Jika job dikonfigurasi dengan attempts,
                 * BullMQ akan melakukan retry.
                 */
                throw error;
            } finally {
                timer();
                deliverySpan.end();
            }
        },

        {
            connection: redisConnection,

            concurrency: CONCURRENCY,
        }
    );


notificationWorker.on(
    "failed",
    async (job, error) => {

        if (!job) {
            return;
        }

        const notification =
            await notificationRepository.findById(
                job.data.notificationId
            );

        if (!notification) {
            BusinessLogger.error(
                "Notification not found during failed job",
                {
                    jobId: job.id,
                    notificationId:
                        job.data.notificationId,
                }
            );

            return;
        }

        const attempt =
            job.attemptsMade;

        BusinessLogger.error(
            "Notification worker job failed",
            {
                jobId: job.id,
                notificationId:
                    notification.id,
                error: error.message,
                attempt,
                maxAttempts:
                    NOTIFICATION_MAX_ATTEMPTS,
            }
        );

        if (
            attempt <
            NOTIFICATION_MAX_ATTEMPTS
        ) {

            notificationRetryCounter.inc({
                type: notification.type,
                channel:
                    notification.channel,
            });

            BusinessLogger.warn(
                "Notification job will be retried",
                {
                    jobId: job.id,
                    notificationId:
                        notification.id,
                    attempt,
                    nextAttempt:
                        attempt + 1,
                }
            );

            return;
        }

        await notificationDLQ.add(
            NOTIFICATION_DLQ_JOB,
            {
                notificationId:
                    notification.id,
            },
            {
                jobId:
                    `notification-dlq:${notification.id}`,
            }
        );

        notificationDLQCounter.inc({
            type: notification.type,
            channel:
                notification.channel,
        });

        BusinessLogger.error(
            "Notification moved to DLQ",
            {
                jobId: job.id,
                notificationId:
                    notification.id,
                attempts:
                    NOTIFICATION_MAX_ATTEMPTS,
                reason:
                    error.message,
            }
        );
    }
);


/**
 * Worker error
 */
notificationWorker.on(
    "error",
    (error) => {

        BusinessLogger.error(
            "Notification worker error",
            {
                error: error.message,
            }
        );

    }
);