import { paymentQueue } from "../queue/payment.queue";
import { PaymentJobs } from "../queue/payment.jobs";
import { BusinessLogger } from "../../../shared/logger/business-logger";

export class PaymentScheduler {

    async bootstrap() {

        BusinessLogger.info(
            "Bootstrapping Payment Scheduler..."
        );

        await paymentQueue.upsertJobScheduler(
            "payment-reconcile",

            {
                every: 60 * 1000,
            },

            {
                name: PaymentJobs.RECONCILE_ALL,
                data: {},
            }
        );

        BusinessLogger.info(
            "Payment reconciliation scheduler registered."
        );

    }

}

export const paymentScheduler =
    new PaymentScheduler();