/**
 * Queue provider abstraction for BullMQ / QStash migration
 * Supports both persistent worker (BullMQ) and serverless HTTP (QStash)
 */

export interface QueueJobOptions {
    attempts?: number;
    backoff?: {
        type: 'exponential' | 'fixed';
        delay: number;
    };
    delay?: number;
    jobId?: string;
}

export interface IQueueProvider {
    /**
     * Enqueue withdrawal processing job
     */
    enqueueWithdrawal(withdrawalId: string, options?: QueueJobOptions): Promise<void>;

    /**
     * Enqueue notification delivery job
     */
    enqueueNotification(notificationId: string, options?: QueueJobOptions): Promise<void>;

    /**
     * Enqueue payment job (RECONCILE, RECONCILE_ALL, EXPIRE, WEBHOOK_RETRY)
     */
    enqueuePayment(jobType: string, data: { referenceNumber?: string }, options?: QueueJobOptions): Promise<void>;

    /**
     * Enqueue payment webhook retry
     */
    enqueuePaymentWebhook(data: any, options?: QueueJobOptions): Promise<void>;

    /**
     * Schedule recurring job (e.g. withdrawal reconciliation)
     */
    scheduleRecurringJob?(name: string, cron: string, url: string): Promise<void>;
}
