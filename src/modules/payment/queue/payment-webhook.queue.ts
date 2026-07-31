import {Queue} from 'bullmq';
import { redisConnection } from '../../../shared/queue/bullmq';

export const paymentWebhookQueue = new Queue(
    "payment-webhook",
    {
        connection: redisConnection,

        defaultJobOptions: {
            attempts: 5,
            backoff: {
                type: "exponential",
                delay: 3000,
            },
            removeOnComplete: 100,
            removeOnFail: false,
        }
    }
)