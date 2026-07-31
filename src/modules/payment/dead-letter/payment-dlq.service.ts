import { BusinessLogger } from "../../../shared/logger/business-logger";
import { paymentDLQ } from "./payment-dlq.queue";

export class PaymentDLQService {
    async moveToDLQ(
        notification: any,
        error: Error,
        attempts: number
    ) {
        await paymentDLQ.add(
            "dead-payment",
            {
                notification,
                error: error.message,
                attempts,
                failedAt: new Date()
            }
        );

        BusinessLogger.error(
            "Payment moved to DLQ",
            {
                orderId: notification.orderId,
                attempts,
                error: error.message
            }
        )
    }
}

export const paymentDLQService = new PaymentDLQService();