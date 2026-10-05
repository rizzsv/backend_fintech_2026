import "./shared/config/env";
import app from "./app";
import { logger } from "./shared/logger/logger";
import { sdk }from "./shared/telemetry/tracing";
import { closeQueues }from "./shared/queue/shutdown";
import { redis }from "./shared/config/redis";
import { env } from "./shared/config/env";

// Import workers/schedulers conditionally based on QUEUE_PROVIDER
// QUEUE_PROVIDER=qstash: workers disabled (QStash HTTP endpoints handle jobs)
// QUEUE_PROVIDER=bullmq: workers enabled (BullMQ processes jobs)

// Payment workers/schedulers remain disabled for debugging
// import { paymentWorker }from "./modules/payment/workers/payment.worker";
// import { paymentScheduler }from "./modules/payment/jobs/payment.scheduler";
// import { paymentWebhookWorker } from "./modules/payment/workers/payment-webhook.worker";
// import { paymentDLQWorker } from "./modules/payment/dead-letter/payment-dlq.worker";
// import "./modules/withdrawal/workers/withdrawal.worker";
// import "./modules/notification/workers/notification.worker";
// import "./modules/payment/workers/payment.worker";
// import { startNotificationQueueMetricCollector } from "./modules/notification/observability/notification.metrics";




let server: any;
let withdrawalReconciliationScheduler: any;


async function bootstrap() {

    try {

        // Telemetry disabled - OTLP collector not available
        // await sdk.start();
        logger.warn('Telemetry SDK disabled - OTLP collector not running');

        // Conditional import based on QUEUE_PROVIDER (inside async function to avoid top-level await)
        if (env.QUEUE_PROVIDER === 'bullmq') {
            const module = await import("./modules/withdrawal/jobs/withdrawal.reconciliation.scheduler.js");
            withdrawalReconciliationScheduler = module.withdrawalReconciliationScheduler;
        }

        const PORT = parseInt(process.env.PORT || '3000', 10);


        server =
            app.listen(
                PORT,
                "0.0.0.0",
                () => {

                    logger.info(
                        `Server running on port ${PORT}`
                    );
                    logger.info(
                        `Queue provider: ${env.QUEUE_PROVIDER || 'bullmq'}`
                    );
                    logger.info(
                        `Payment mode: ${env.PAYMENT_MODE}`
                    );

                }
            );


        // Start withdrawal reconciliation scheduler based on QUEUE_PROVIDER
        if (env.QUEUE_PROVIDER === 'bullmq' && withdrawalReconciliationScheduler) {
            withdrawalReconciliationScheduler.start();
            logger.info('Withdrawal reconciliation scheduler started (node-cron)');
        } else if (env.QUEUE_PROVIDER === 'qstash') {
            logger.info('Withdrawal reconciliation: using QStash external schedule (node-cron disabled)');
        }

        // Other schedulers disabled temporarily for startup debugging
        // await paymentScheduler.bootstrap();
        // startNotificationQueueMetricCollector();
        logger.warn('Background schedulers disabled for debugging');

        logger.info(
            "Application bootstrap completed"
        );


    }

    catch(error) {


        logger.fatal(
            error,
            "Failed to start application"
        );


        process.exit(1);

    }

}


// Only start the server if this file is run directly (not imported by Vercel)
// Vercel imports the app from api/index.ts instead
if (require.main === module) {
    bootstrap();
}





async function gracefulShutdown(
    signal:string
) {


    logger.info(
        `${signal} received, shutting down...`
    );


    

    try {

        if(server){

            await new Promise<void>(
                resolve => {

                    server.close(
                        () => resolve()
                    );

                }
            );

        }

        // Stop withdrawal reconciliation scheduler
        if (env.QUEUE_PROVIDER === 'bullmq' && withdrawalReconciliationScheduler) {
            withdrawalReconciliationScheduler.stop();
        }

        // withdrawalReconciliationScheduler.stop();

        // await paymentWorker.close();

        // await paymentWebhookWorker.close();

        // await paymentDLQWorker.close();

        await closeQueues();

        await redis.disconnect();

        await sdk.shutdown();



        logger.info(
            "Application shutdown completed"
        );


        process.exit(0);


    }

    catch(error){


        logger.error(
            error,
            "Shutdown failed"
        );


        process.exit(1);

    }

}




process.on(
    "SIGINT",
    () => gracefulShutdown("SIGINT")
);


process.on(
    "SIGTERM",
    () => gracefulShutdown("SIGTERM")
);