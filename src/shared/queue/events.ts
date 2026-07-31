import {
    createQueueEvents,
} from './bullmq';
import {
    QueueName,
} from './queue-name'
import {
   BusinessLogger
} from '../logger/business-logger';

export const paymentQueueEvents = createQueueEvents(QueueName.PAYMENT);

paymentQueueEvents.on(

    "completed",

    ({ jobId }) => {

        BusinessLogger.info(

            "BullMQ Job Completed",

            {

                jobId,

            }

        );

    }

);

paymentQueueEvents.on(

    "failed",

    ({ jobId, failedReason }) => {

        BusinessLogger.error(

            "BullMQ Job Failed",

            {

                jobId,

                failedReason,

            }

        );

    }

);