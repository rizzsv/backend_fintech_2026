import app from "./app";
import { logger } from "./shared/logger/logger";
import { sdk }from "./shared/telemetry/tracing";
import { closeQueues }from "./shared/queue/shutdown";
import { redis }from "./shared/config/redis";
import { paymentWorker }from "./modules/payment/workers/payment.worker";
import { paymentScheduler }from "./modules/payment/jobs/payment.scheduler";
import { paymentWebhookWorker } from "./modules/payment/workers/payment-webhook.worker";
import { paymentDLQWorker } from "./modules/payment/dead-letter/payment-dlq.worker";



let server: any;


async function bootstrap() {

    try {


        await sdk.start();


        await redis.connect();


        const PORT =
            process.env.PORT || 3000;



        server =
            app.listen(
                PORT,
                () => {

                    logger.info(
                        `Server running on port ${PORT}`
                    );

                }
            );



        await paymentScheduler.bootstrap();



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


        await paymentWorker.close();

        await paymentWebhookWorker.close();

        await paymentDLQWorker.close();

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