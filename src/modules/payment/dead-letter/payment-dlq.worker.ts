import {Worker} from 'bullmq';
import {redisConnection} from '../../../shared/queue/bullmq';
import { BusinessLogger } from '../../../shared/logger/business-logger';

export const paymentDLQWorker = new Worker (
    "payment-dlq",

    async (job) => {
        BusinessLogger.warn(
            "Dead Letter Job",
            {
                jobId: job.id,
                orderId: job.data.notification.order_id,
                error: job.data.error,
            }
        )
    },
    {
        connection: redisConnection,
    }
)