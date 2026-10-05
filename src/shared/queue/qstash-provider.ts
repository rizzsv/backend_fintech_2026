import { IQueueProvider, QueueJobOptions } from "./queue-provider.interface";
import { publishToQStash } from "./qstash.client";
import { env } from "../config/env";
import { BusinessLogger } from "../logger/business-logger";

/**
 * QStash implementation of queue provider
 * Publishes jobs to HTTP endpoints instead of Redis queues
 */
export class QStashProvider implements IQueueProvider {
    private getBackendUrl(): string {
        if (!env.BACKEND_URL) {
            throw new Error('BACKEND_URL must be set when using QStash provider');
        }
        return env.BACKEND_URL;
    }

    async enqueueWithdrawal(withdrawalId: string, options?: QueueJobOptions): Promise<void> {
        const url = `${this.getBackendUrl()}/api/workers/withdrawal`;
        
        await publishToQStash({
            url,
            body: { withdrawalId },
            retries: options?.attempts ?? 5,
            delay: options?.delay,
            deduplicationId: options?.jobId,
        });

        BusinessLogger.info('Withdrawal job enqueued to QStash', {
            withdrawalId,
            url,
        });
    }

    async enqueueNotification(notificationId: string, options?: QueueJobOptions): Promise<void> {
        const url = `${this.getBackendUrl()}/api/workers/notification`;
        
        await publishToQStash({
            url,
            body: { notificationId },
            retries: options?.attempts ?? 3,
            delay: options?.delay,
            deduplicationId: options?.jobId,
        });

        BusinessLogger.info('Notification job enqueued to QStash', {
            notificationId,
            url,
        });
    }

    async enqueuePayment(
        jobType: string,
        data: { referenceNumber?: string },
        options?: QueueJobOptions
    ): Promise<void> {
        const url = `${this.getBackendUrl()}/api/workers/payment/${jobType}`;
        
        await publishToQStash({
            url,
            body: data,
            retries: options?.attempts ?? 5,
            delay: options?.delay,
            deduplicationId: options?.jobId,
        });

        BusinessLogger.info('Payment job enqueued to QStash', {
            jobType,
            referenceNumber: data.referenceNumber,
            url,
        });
    }

    async enqueuePaymentWebhook(data: any, options?: QueueJobOptions): Promise<void> {
        const url = `${this.getBackendUrl()}/api/workers/payment/WEBHOOK_RETRY`;
        
        await publishToQStash({
            url,
            body: data,
            retries: options?.attempts ?? 3,
            delay: options?.delay,
            deduplicationId: options?.jobId,
        });

        BusinessLogger.info('Payment webhook retry enqueued to QStash', {
            url,
        });
    }
}

export const qstashProvider = new QStashProvider();
