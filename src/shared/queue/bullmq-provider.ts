import { IQueueProvider, QueueJobOptions } from "./queue-provider.interface";
import { paymentQueue } from "../../modules/payment/queue/payment.queue";
import { notificationQueue } from "../../modules/notification/queue/notification.queue";
import { withdrawalQueue } from "../../modules/withdrawal/queue/withdrawal.queue";
import { paymentWebhookQueue } from "../../modules/payment/queue/payment-webhook.queue";

/**
 * BullMQ implementation of queue provider
 * Uses existing BullMQ queues and workers
 * In serverless mode, queue.add operations are no-ops
 */
export class BullMQProvider implements IQueueProvider {
    async enqueueWithdrawal(withdrawalId: string, options?: QueueJobOptions): Promise<void> {
        await withdrawalQueue.add(
            'process-withdrawal',
            { withdrawalId },
            { jobId: options?.jobId }
        );
    }

    async enqueueNotification(notificationId: string, options?: QueueJobOptions): Promise<void> {
        await notificationQueue.add(
            'send-notification',
            { notificationId },
            { jobId: options?.jobId }
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
            { jobId: options?.jobId }
        );
    }

    async enqueuePaymentWebhook(data: any, options?: QueueJobOptions): Promise<void> {
        await paymentWebhookQueue.add(
            "process-payment-webhook",
            data,
            { jobId: options?.jobId }
        );
    }
}

export const bullmqProvider = new BullMQProvider();
