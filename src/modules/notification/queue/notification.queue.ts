import {Queue} from 'bullmq';
import { redis } from '../../../shared/config/redis';

export const notificationQueue = new Queue("notification", {
    connection: redis,
    defaultJobOptions: {
        attempts: 5,
        removeOnComplete: 500,
        removeOnFail: 1000,
        backoff: {
            type: "exponential",
            delay: 3000
        }
    }
})