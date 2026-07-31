import {JobsOptions} from 'bullmq';
import {
    createQueue,
} from './bullmq';
import {
    QueueName,
} from './queue-name'

const defaultJobOptions: JobsOptions = {
    attempts: 5,
    removeOnComplete: 100,
    removeOnFail: 100,
    backoff: {
        type: 'exponential',
        delay: 5000,
    }
};

export const paymentQueue = createQueue(
    QueueName.PAYMENT,
    defaultJobOptions
)