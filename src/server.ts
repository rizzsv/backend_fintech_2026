import "./shared/config/env";
import app from "./app";
import { logger } from "./shared/logger/logger";
import { sdk }from "./shared/telemetry/tracing";
import { closeQueues }from "./shared/queue/shutdown";
import { redis }from "./shared/config/redis";
// Workers and schedulers disabled for debugging
// import { paymentWorker }from "./modules/payment/workers/payment.worker";
// import { paymentScheduler }from "./modules/payment/jobs/payment.scheduler";
// import { paymentWebhookWorker } from "./modules/payment/workers/payment-webhook.worker";
// import { paymentDLQWorker } from "./modules/payment/dead-letter/payment-dlq.worker";
// import {withdrawalReconciliationScheduler} from "./modules/withdrawal/jobs/withdrawal.reconciliation.scheduler";
// import "./modules/withdrawal/workers/withdrawal.worker";
// import "./modules/notification/workers/notification.worker";
// import "./modules/payment/workers/payment.worker";
// import { startNotificationQueueMetricCollector } from "./modules/notification/observability/notification.metrics";




let server: any;


async function bootstrap() {

    try {

        // Telemetry disabled - OTLP collector not available
        // await sdk.start();
        logger.warn('Telemetry SDK disabled - OTLP collector not running');

        const PORT = parseInt(process.env.PORT || '3000', 10);



        server =
            app.listen(
                PORT,
                "0.0.0.0",
                () => {

                    logger.info(
                        `Server running on port ${PORT}`
                    );

                }
            );



        // Schedulers disabled temporarily for startup debugging
        // await paymentScheduler.bootstrap();
        // startNotificationQueueMetricCollector();
        // withdrawalReconciliationScheduler.start();
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


bootstrap();





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