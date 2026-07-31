import { paymentQueue } from "./payment.queue";
import { PaymentJobs } from "./payment.jobs";

export class PaymentJob {
    async addReconciliationJob(
        referenceNumber: string,
    ) {
        return paymentQueue.add(
            PaymentJobs.RECONCILE,
            {
                referenceNumber,
            },
            {
                jobId: `payment-reconcile-${referenceNumber}`,
                removeOnComplete: 100,
                removeOnFail: 1000,
            }
        );
    }

    async addReconcileAllJob() {
        return paymentQueue.add(
            PaymentJobs.RECONCILE_ALL,
            {},
            {
                jobId: "payment-reconcile-all",
                removeOnComplete: 10,
                removeOnFail: 100,
            }
        );
    }

    async addExpireJob(
        referenceNumber: string,
        delay: number,
    ) {
        return paymentQueue.add(
            PaymentJobs.EXPIRE,
            {
                referenceNumber,
            },
            {
                delay,
                jobId: `payment-expire-${referenceNumber}`,
                removeOnComplete: 100,
                removeOnFail: 1000,
            }
        );
    }

    async addCancelJob(
        referenceNumber: string,
    ) {
        return paymentQueue.add(
            PaymentJobs.CANCEL,
            {
                referenceNumber,
            },
            {
                jobId: `payment-cancel-${referenceNumber}`,
                removeOnComplete: 100,
                removeOnFail: 1000,
            }
        );
    }

    async addRetryWebhookJob(
        referenceNumber: string,
    ) {
        return paymentQueue.add(
            PaymentJobs.WEBHOOK_RETRY,
            {
                referenceNumber,
            },
            {
                jobId: `payment-webhook-retry-${referenceNumber}`,
                removeOnComplete: 100,
                removeOnFail: 1000,
            }
        );
    }
}

export const paymentJob = new PaymentJob();