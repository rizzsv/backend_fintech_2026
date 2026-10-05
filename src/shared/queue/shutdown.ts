import { env } from "../config/env";
import { BusinessLogger } from "../logger/business-logger";

export async function closeQueues() {
    // Only close queues if BullMQ is active
    if (env.QUEUE_PROVIDER !== 'bullmq') {
        BusinessLogger.info("Skipping queue close (serverless mode)");
        return;
    }

    BusinessLogger.info("Closing BullMQ...");

    try {
        const { redisConnection } = await import("./bullmq.js");
        const { paymentQueue } = await import("../../modules/payment/queue/payment.queue.js");
        const { withdrawalQueue } = await import("../../modules/withdrawal/queue/withdrawal.queue.js");

        await redisConnection.quit();

        if (paymentQueue && typeof paymentQueue.close === 'function') {
            await paymentQueue.close();
        }
        if (withdrawalQueue && typeof (withdrawalQueue as any).close === 'function') {
            await (withdrawalQueue as any).close();
        }
    } catch (error) {
        BusinessLogger.error("Error closing queues", { error });
    }
}
