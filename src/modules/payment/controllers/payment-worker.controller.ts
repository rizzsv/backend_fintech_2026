import { Request, Response } from "express";
import { BusinessLogger } from "../../../shared/logger/business-logger";
import { paymentReconciliationService } from "../services/payment.reconciliation.service";
import { paymentService } from "../services/payment.service";
import { getQStashRetryInfo } from "../../../shared/queue/qstash.middleware";

/**
 * QStash HTTP endpoints for payment jobs
 * Called by QStash instead of BullMQ worker when QUEUE_PROVIDER=qstash
 */
export const paymentWorkerController = {
    async processPaymentJob(req: Request, res: Response): Promise<void> {
        try {
            const { jobType } = req.params;
            const { referenceNumber } = req.body;

            const retryInfo = getQStashRetryInfo(req);

            BusinessLogger.info("QStash payment worker triggered", {
                jobType,
                referenceNumber,
                retryCount: retryInfo.retryCount,
            });

            switch (jobType) {
                case "RECONCILE":
                    if (!referenceNumber) {
                        res.status(400).json({ error: "referenceNumber required for RECONCILE" });
                        return;
                    }
                    await paymentReconciliationService.reconcile(referenceNumber);
                    break;

                case "RECONCILE_ALL":
                    await paymentReconciliationService.reconcileAll();
                    break;

                case "EXPIRE":
                    if (!referenceNumber) {
                        res.status(400).json({ error: "referenceNumber required for EXPIRE" });
                        return;
                    }
                    await paymentService.expirePayment(referenceNumber);
                    break;

                case "WEBHOOK_RETRY":
                    if (!referenceNumber) {
                        res.status(400).json({ error: "referenceNumber required for WEBHOOK_RETRY" });
                        return;
                    }
                    await paymentReconciliationService.reconcile(referenceNumber);
                    break;

                default:
                    res.status(400).json({ error: `Unknown payment job type: ${jobType}` });
                    return;
            }

            BusinessLogger.info("QStash payment worker completed", {
                jobType,
                referenceNumber,
            });

            res.status(200).json({ success: true });
        } catch (error) {
            BusinessLogger.error("QStash payment worker failed", {
                jobType: req.params?.jobType,
                referenceNumber: req.body?.referenceNumber,
                error: error instanceof Error ? error.message : String(error),
            });

            // Return 200 to prevent retry for business logic errors
            res.status(200).json({
                success: false,
                error: error instanceof Error ? error.message : "Payment job processing failed",
            });
        }
    },
};
