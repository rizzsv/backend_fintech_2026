import { Express } from "express";
import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { paymentQueue } from "../../modules/payment/queue/payment.queue";
import basicAuth from "express-basic-auth";
import { env } from "../config/env";
import { paymentWebhookQueue } from "../../modules/payment/queue/payment-webhook.queue";
import { paymentDLQ } from "../../modules/payment/dead-letter/payment-dlq.queue";

const serverAdapter = new ExpressAdapter();

serverAdapter.setBasePath("/admin/queues");

createBullBoard({
    queues: [
         new BullMQAdapter(paymentQueue),

        new BullMQAdapter(paymentWebhookQueue),

        new BullMQAdapter(paymentDLQ),
    ],
    serverAdapter,
});

const bullAuth =
    basicAuth({

        users: {

            [env.BULL_BOARD_USERNAME]: env.BULL_BOARD_PASSWORD,

        },

        challenge:true,

    });

export function setupBullBoard(
    app: Express,
) {

    app.use(

        "/admin/queues",

        bullAuth,

        serverAdapter.getRouter()

    );

}