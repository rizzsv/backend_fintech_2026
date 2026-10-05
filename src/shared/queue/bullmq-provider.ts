import { IQueueProvider, QueueJobOptions } from "./queue-provider.interface";
import { paymentQueue } from "../../modules/payment/queue/payment.queue";
import { notificationQueue } from "../../modules/notification/queue/notification.queue";
import { withdrawalQueue } from "../../modules/withdrawal/queue/withdrawal.queue";
import { paymentWebhookQueue } from "../../modules/payment/queue/payment-webhook.queue";

/**
 * BullMQ implementation of queue provider
 * Uses existing BullMQ queues and workers
 */
export class BullMQProvider implements IQueueProvider {
    async enqueueWithdrawal(withdrawalId: string, options?: QueueJobOptions): Promise<void> {
        await withdrawalQueue.add(
            'process-withdrawal',
            { withdrawalId },
            {
                attempts: options?.attempts ?? 5,
                backoff: options?.backoff ? {
                    type: options.backoff.type,
                    delay: options.backoff.delay,
                } : {
                    type: 'exponential',
                    delay: 2000,
                },
                delay: options?.delay,
                jobId: options?.jobId,
            }
        );
    }

    async enqueueNotification(notificationId: string, options?: QueueJobOptions): Promise<void> {
        await notificationQueue.add(
            'send-notification',
            { notificationId },
            {
                attempts: options?.attempts ?? 3,
                backoff: options?.backoff,
                delay: options?.delay,
                jobId: options?.jobId,
            }
        );
    }

    async enqueuePayment(
        jobType: string,
        data: { referenceNumber?: string },
        options?: QueueJobOptions
    ): Promise<void> {
        await paymentQueue.add(
            jobType,
            data,
            {
                attempts: options?.attempts ?? 5,
                backoff: options?.backoff,
                delay: options?.delay,
                jobId: options?.jobId,
            }
        );
    }

    async enqueuePaymentWebhook(data: any, options?: QueueJobOptions): Promise<void> {
        await paymentWebhookQueue.add(
            "process-payment-webhook",
            data,
            {
                attempts: options?.attempts ?? 3,
                backoff: options?.backoff,
                delay: options?.delay,
                jobId: options?.jobId,
            }
        );
    }
}

export const bullmqProvider = new BullMQProvider();
