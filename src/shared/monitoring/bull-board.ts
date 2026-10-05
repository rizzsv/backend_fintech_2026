import { Express } from "express";
import basicAuth from "express-basic-auth";
import { env } from "../config/env";

/**
 * Bull Board setup - only active when QUEUE_PROVIDER=bullmq
 * In serverless mode, this is a no-op
 */
export function setupBullBoard(app: Express) {
    if (env.QUEUE_PROVIDER !== 'bullmq') {
        // No-op in serverless mode
        return;
    }

    // Lazy import to avoid BullMQ initialization at module load
    const { createBullBoard } = require("@bull-board/api");
    const { ExpressAdapter } = require("@bull-board/express");
    const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");

    // These will now be lazy-initialized
    const { paymentQueue } = require("../../modules/payment/queue/payment.queue");
    const { paymentWebhookQueue } = require("../../modules/payment/queue/payment-webhook.queue");
    const { paymentDLQ } = require("../../modules/payment/dead-letter/payment-dlq.queue");
    const { notificationQueue } = require("../../modules/notification/queue/notification.queue");
    const { withdrawalQueue } = require("../../modules/withdrawal/queue/withdrawal.queue");
    const { notificationDLQ } = require("../../modules/notification/queue/notification-dlq.queue");

    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath("/admin/queues");

    // Filter out null queues (serverless wrappers return objects, not actual queues)
    const queues = [
        paymentQueue,
        paymentWebhookQueue,
        paymentDLQ,
        notificationQueue,
        withdrawalQueue,
        notificationDLQ,
    ].filter(q => q && typeof q.add === 'function' && q.opts);

    createBullBoard({
        queues: queues.map((q: any) => new BullMQAdapter(q)),
        serverAdapter,
    });

    const bullAuth = basicAuth({
        users: {
            [env.BULL_BOARD_USERNAME || 'admin']: env.BULL_BOARD_PASSWORD || 'admin',
        },
        challenge: true,
    });

    app.use("/admin/queues", bullAuth, serverAdapter.getRouter());
}
