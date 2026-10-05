import { Queue, JobsOptions, Job } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../logger/logger';
import { QueueName } from './queue-name';

const defaultJobOptions: JobsOptions = {
    attempts: 5,
    removeOnComplete: 100,
    removeOnFail: 100,
    backoff: {
        type: 'exponential',
        delay: 5000,
    }
};

let _paymentQueue: Queue | null = null;

function getPaymentQueue(): Queue | null {
    if (env.QUEUE_PROVIDER !== 'bullmq') {
        return null;
    }

    if (!_paymentQueue) {
        const { redisConnection } = require('./bullmq');
        _paymentQueue = new Queue(
            QueueName.PAYMENT,
            {
                connection: redisConnection,
                defaultJobOptions
            }
        );
    }

    return _paymentQueue;
}

export const paymentQueue = {
    add: async (
        jobName: string,
        data: any,
        opts?: JobsOptions & { jobId?: string }
    ): Promise<Job | null> => {
        const queue = getPaymentQueue();
        if (!queue) {
            logger.info({ jobName, data, msg: "Payment queue add skipped (serverless)" });
            return null;
        }
        return queue.add(jobName, data, opts);
    },

    upsertJobScheduler: async (
        schedulerName: string,
        repeatOpts: { every: number },
        template: { name: string; data: any }
    ): Promise<void> => {
        const queue = getPaymentQueue();
        if (!queue) {
            logger.info({ schedulerName, msg: "Payment scheduler skipped (serverless)" });
            return;
        }
        await queue.upsertJobScheduler(schedulerName, repeatOpts, template);
    },

    getJobCounts: async (): Promise<{
        waiting: number;
        active: number;
        failed: number;
        completed: number;
    }> => {
        const queue = getPaymentQueue();
        if (!queue) {
            return { waiting: 0, active: 0, failed: 0, completed: 0 };
        }
        const counts = await queue.getJobCounts('waiting', 'active', 'failed', 'completed');
        return {
            waiting: counts.waiting ?? 0,
            active: counts.active ?? 0,
            failed: counts.failed ?? 0,
            completed: counts.completed ?? 0
        };
    },

    close: async () => {
        if (_paymentQueue) {
            await _paymentQueue.close();
            _paymentQueue = null;
        }
    }
};
