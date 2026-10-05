import { Queue } from 'bullmq';
import { env } from '../../../shared/config/env';
import { logger } from '../../../shared/logger/logger';

export const WITHDRAWAL_QUEUE_NAME = 'withdrawal';

let _withdrawalQueue: Queue | null = null;

function getWithdrawalQueue(): Queue | null {
    if (env.QUEUE_PROVIDER !== 'bullmq') {
        return null;
    }

    if (!_withdrawalQueue) {
        const { redisConnection } = require('../../../shared/queue/bullmq');
        _withdrawalQueue = new Queue(
            WITHDRAWAL_QUEUE_NAME,
            {
                connection: redisConnection,
                defaultJobOptions: {
                    attempts: 5,
                    backoff: {
                        type: 'exponential',
                        delay: 5000
                    },
                    removeOnComplete: {
                        age: 3600,
                        count: 1000
                    },
                    removeOnFail: false
                }
            }
        );
    }

    return _withdrawalQueue;
}

export const withdrawalQueue = {
    add: async (
        jobName: string,
        data: any,
        opts?: { jobId?: string }
    ) => {
        const queue = getWithdrawalQueue();
        if (!queue) {
            logger.info({ jobName, data, msg: "Withdrawal queue add skipped (serverless)" });
            return null;
        }
        return queue.add(jobName, data, opts);
    }
};
