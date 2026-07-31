import { paymentRepository } from "../repositories/payment.repository";
import { midtransProvider } from "../providers/midtrans.provider";

import { BusinessLogger } from "../../../shared/logger/business-logger";
import { paymentWebhookService } from "./payment.webhook.service";

export class PaymentReconciliationService {

    async reconcile(referenceNumber: string) {

        BusinessLogger.info(
            "Reconciling payment",
            {
                referenceNumber,
            }
        );

        const payment =
            await paymentRepository.findByReference(
                referenceNumber
            );

        if (!payment) {

            throw new Error(
                "Payment not found"
            );

        }

        const notification =
            await midtransProvider.getTransaction(
                referenceNumber
            );


        return paymentWebhookService.handleNotification(
            notification
        );

    }


    async reconcileAll() {

        BusinessLogger.info(
            "Reconciling pending payments"
        );

        const pendings =
            await paymentRepository.findPending();

        for (const payment of pendings) {

            try {

                await this.reconcile(
                    payment.referenceNumber
                );

            }

            catch (err) {

                BusinessLogger.error(
                    "Reconciliation failed",
                    {
                        paymentId: payment.id,
                        referenceNumber:
                            payment.referenceNumber,
                        error: err,
                    }
                );

            }

        }

    }

}

export const paymentReconciliationService =
    new PaymentReconciliationService();