import {Queue} from 'bullmq';
import {redisConnection} from '../../../shared/queue/bullmq';

export const paymentDLQ = new Queue (
    'payment-dlq',
    {
        connection: redisConnection,
        defaultJobOptions: {
            removeOnComplete: false,
            removeOnFail: false
        }
    }
)