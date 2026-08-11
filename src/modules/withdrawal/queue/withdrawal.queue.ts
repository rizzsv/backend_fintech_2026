import {Queue} from 'bullmq';
import {redis} from '../../../shared/config/redis';

export const withdrawalQueue = new Queue(
    'withdrawal',
    {
        connection: redis,
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