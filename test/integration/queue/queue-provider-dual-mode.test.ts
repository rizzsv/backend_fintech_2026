import { describe, it, expect, beforeEach, vi } from "vitest";
import { queueProvider } from "../../../src/shared/queue/queue-provider.factory";
import { env } from "../../../src/shared/config/env";

// Mock environment
vi.mock("../../../src/shared/config/env", async () => {
    const actual = await vi.importActual<typeof import("../../../src/shared/config/env")>(
        "../../../src/shared/config/env"
    );
    return {
        ...actual,
        env: {
            ...actual.env,
            QUEUE_PROVIDER: "bullmq",
        },
    };
});

// Mock BullMQ queues
vi.mock("../../../src/modules/withdrawal/queue/withdrawal.queue", () => ({
    withdrawalQueue: {
        add: vi.fn().mockResolvedValue({ id: "job_1" }),
    },
}));

vi.mock("../../../src/modules/notification/queue/notification.queue", () => ({
    notificationQueue: {
        add: vi.fn().mockResolvedValue({ id: "job_2" }),
    },
}));

vi.mock("../../../src/modules/payment/queue/payment.queue", () => ({
    paymentQueue: {
        add: vi.fn().mockResolvedValue({ id: "job_3" }),
    },
}));

vi.mock("../../../src/modules/payment/queue/payment-webhook.queue", () => ({
    paymentWebhookQueue: {
        add: vi.fn().mockResolvedValue({ id: "job_4" }),
    },
}));

// Mock QStash client
vi.mock("../../../src/shared/queue/qstash.client", () => ({
    publishToQStash: vi.fn().mockResolvedValue({ messageId: "msg_1" }),
}));

import { withdrawalQueue } from "../../../src/modules/withdrawal/queue/withdrawal.queue";
import { notificationQueue } from "../../../src/modules/notification/queue/notification.queue";
import { paymentQueue } from "../../../src/modules/payment/queue/payment.queue";
import { paymentWebhookQueue } from "../../../src/modules/payment/queue/payment-webhook.queue";
import { publishToQStash } from "../../../src/shared/queue/qstash.client";

describe("Queue Provider - Dual Mode Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("BullMQ Mode (QUEUE_PROVIDER=bullmq)", () => {
        it("should route withdrawal jobs to BullMQ queue", async () => {
            await queueProvider.enqueueWithdrawal("wth_123");

            expect(withdrawalQueue.add).toHaveBeenCalledWith(
                "process-withdrawal",
                { withdrawalId: "wth_123" },
                expect.any(Object)
            );
            expect(publishToQStash).not.toHaveBeenCalled();
        });

        it("should route notification jobs to BullMQ queue", async () => {
            await queueProvider.enqueueNotification("notif_123");

            expect(notificationQueue.add).toHaveBeenCalledWith(
                "send-notification",
                { notificationId: "notif_123" },
                expect.any(Object)
            );
            expect(publishToQStash).not.toHaveBeenCalled();
        });

        it("should route payment jobs to BullMQ queue", async () => {
            await queueProvider.enqueuePayment("RECONCILE", { paymentId: "pay_123" });

            expect(paymentQueue.add).toHaveBeenCalledWith(
                "RECONCILE",
                { paymentId: "pay_123" },
                expect.any(Object)
            );
            expect(publishToQStash).not.toHaveBeenCalled();
        });

        it("should route payment webhook retry to BullMQ queue", async () => {
            await queueProvider.enqueuePaymentWebhook({ orderId: "ord_123", attempt: 1 });

            expect(paymentWebhookQueue.add).toHaveBeenCalledWith(
                "process-payment-webhook",
                { orderId: "ord_123", attempt: 1 },
                expect.any(Object)
            );
            expect(publishToQStash).not.toHaveBeenCalled();
        });
    });

    describe("Provider Selection", () => {
        it("should use BullMQ provider when QUEUE_PROVIDER=bullmq", () => {
            expect(env.QUEUE_PROVIDER).toBe("bullmq");
        });

        it("should have all required methods on queue provider", () => {
            expect(typeof queueProvider.enqueueWithdrawal).toBe("function");
            expect(typeof queueProvider.enqueueNotification).toBe("function");
            expect(typeof queueProvider.enqueuePayment).toBe("function");
            expect(typeof queueProvider.enqueuePaymentWebhook).toBe("function");
        });
    });
});
