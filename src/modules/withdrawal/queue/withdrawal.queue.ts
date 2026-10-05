import {Queue} from 'bullmq';
import {redisConnection} from '../../../shared/queue/bullmq';

export const withdrawalQueue = new Queue(
    'withdrawal',
    {
        connection: redisConnection,
        defaultJobOptions: {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 5000
            },
            removeOnComplete: {
                age: 3600, // 1 hour
                count: 1000
            },
            removeOnFail: false
        }
    }
)