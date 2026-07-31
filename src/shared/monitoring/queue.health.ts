
import { paymentQueue } from "../../modules/payment/queue/payment.queue";

export async function paymentQueueHealthCheck() {
    const count = await paymentQueue.getJobCounts();

    return {
        waiting: count.waiting,
        active: count.active,
        failed: count.failed,
        completed: count.completed,
    }
}