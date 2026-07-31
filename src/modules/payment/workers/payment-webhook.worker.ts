import {Worker} from "bullmq";
import { redisConnection } from "../../../shared/queue/bullmq";
import { PaymentWebhookService } from "../services/payment.webhook.service";
import { BusinessLogger } from "../../../shared/logger/business-logger";
import { paymentDLQService } from "../dead-letter/payment-dlq.service";
import {context} from "@opentelemetry/api";
import {extractTraceContext} from "../../../shared/telemetry/worker-tracing";
import {withSpan} from "../../../shared/telemetry/span";


const service = new PaymentWebhookService();

export const paymentWebhookWorker = new Worker(
    "payment-webhook",
    async (job) => {
        await service.processWebhook(job.data.notification);
    },
    {
        connection: redisConnection,
        concurrency: 5
    }
)

paymentWebhookWorker.on("completed", (job) => {
    BusinessLogger.info(
        "Worker completed job",
        {
            job: job.name,
            orderId: job.data.notification.order_id,
        }
    )
});

paymentWebhookWorker.on(

    "failed",

    async (job, error) => {

        BusinessLogger.error(

            "Webhook failed",

            {

                jobId:
                    job?.id,

                attempts:
                    job?.attemptsMade,

                error:
                    error.message,

            }

        );

        if (

            job &&

            job.attemptsMade >=
            job.opts.attempts!

        ) {

            await paymentDLQService.moveToDLQ(

                job.data.notification,

                error,

                job.attemptsMade

            );

        }

    }

);

new Worker(
    "payment-webhook",
    async (job) => {
        const ctx = extractTraceContext(job.data.traceContext);
        return context.with(ctx, async () => {
            return withSpan(
                "payment-webhook",
                async () => {
                    await service.processWebhook(job.data.notification);
                }
            )
        }
 )}
)

