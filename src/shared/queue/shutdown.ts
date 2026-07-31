import {
    redisConnection,
} from "./bullmq";

import {
    BusinessLogger,
} from "../logger/business-logger";

export async function closeQueues() {

    BusinessLogger.info(
        "Closing BullMQ..."
    );

    await redisConnection.quit();

}