import { Job } from "bullmq";

import {
    createWorker,
} from "../../../shared/queue/bullmq";

import {
    QueueName,
} from "../../../shared/queue/queue-name";

import {
    PaymentJobs,
} from "../queue/payment.jobs";

import {
    paymentReconciliationService,
} from "../services/payment.reconciliation.service";

import {
    paymentService,
} from "../services/payment.service";

import {
    BusinessLogger,
} from "../../../shared/logger/business-logger";

export const paymentWorker =
    createWorker(

        QueueName.PAYMENT,

        async (job: Job) => {

            BusinessLogger.info(
                "Worker received job",
                {
                    job: job.name,
                    id: job.id,
                }
            );

            switch (job.name) {


                case PaymentJobs.RECONCILE:

                    await paymentReconciliationService
                        .reconcile(
                            job.data.referenceNumber
                        );

                    break;


                case PaymentJobs.RECONCILE_ALL:

                    await paymentReconciliationService
                        .reconcileAll();

                    break;


                case PaymentJobs.EXPIRE:

                    await paymentService
                        .expirePayment(
                            job.data.referenceNumber
                        );

                    break;


                case PaymentJobs.CANCEL:

                    await paymentService
                        .cancelPayment(
                            job.data.referenceNumber
                        );

                    break;

                case PaymentJobs.WEBHOOK_RETRY:

                    await paymentReconciliationService
                        .reconcile(
                            job.data.referenceNumber
                        );

                    break;

                default:

                    BusinessLogger.warn(
                        "Unknown Job",
                        {
                            name:
                                job.name,
                        }
                    );

            }

        }

    );

    paymentWorker.on(

    "completed",

    (job) => {

        BusinessLogger.info(

            "Worker completed",

            {

                jobId:
                    job.id,

                name:
                    job.name,

            }

        );

    }

);

paymentWorker.on(

    "failed",

    (job, err) => {

        BusinessLogger.error(

            "Worker failed",

            {

                jobId:
                    job?.id,

                name:
                    job?.name,

                error:
                    err,

            }

        );

    }

);

paymentWorker.on(

    "error",

    (err) => {

        BusinessLogger.error(

            "Worker Error",

            {

                error: err,

            }

        );

    }

);