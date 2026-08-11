import {
    redisConnection,
} from "./bullmq";

import {
    BusinessLogger,
} from "../logger/business-logger";

import {
    paymentQueue,
} from "../../modules/payment/queue/payment.queue";

import {
    withdrawalQueue,
} from "../../modules/withdrawal/queue/withdrawal.queue";

export async function closeQueues() {

    BusinessLogger.info(
        "Closing BullMQ..."
    );

    await redisConnection.quit();

    await Promise.all([
        paymentQueue.close(),
        withdrawalQueue.close(),
    ])

}