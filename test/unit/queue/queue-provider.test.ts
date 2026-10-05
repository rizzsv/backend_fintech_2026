import { describe, it, expect, beforeEach, vi } from "vitest";
import { queueProvider, getQueueProvider } from "../../../src/shared/queue/queue-provider.factory";
import { bullmqProvider } from "../../../src/shared/queue/bullmq-provider";
import { qstashProvider } from "../../../src/shared/queue/qstash-provider";

// Mock env module
vi.mock("../../../src/shared/config/env", async () => {
    const actual = await vi.importActual<typeof import("../../../src/shared/config/env")>("../../../src/shared/config/env");
    return {
        ...actual,
        env: {
            ...actual.env,
            QUEUE_PROVIDER: "bullmq",
        },
    };
});

describe("Queue Provider Factory", () => {
    it("should return BullMQ provider when QUEUE_PROVIDER=bullmq", () => {
        const provider = getQueueProvider();
        expect(provider).toBe(bullmqProvider);
    });

    it("should provide enqueueWithdrawal method", () => {
        expect(typeof queueProvider.enqueueWithdrawal).toBe("function");
    });

    it("should provide enqueueNotification method", () => {
        expect(typeof queueProvider.enqueueNotification).toBe("function");
    });

    it("should provide enqueuePayment method", () => {
        expect(typeof queueProvider.enqueuePayment).toBe("function");
    });
});

describe("BullMQ Provider", () => {
    it("should have all required methods", () => {
        expect(typeof bullmqProvider.enqueueWithdrawal).toBe("function");
        expect(typeof bullmqProvider.enqueueNotification).toBe("function");
        expect(typeof bullmqProvider.enqueuePayment).toBe("function");
    });
});

describe("QStash Provider", () => {
    it("should have all required methods", () => {
        expect(typeof qstashProvider.enqueueWithdrawal).toBe("function");
        expect(typeof qstashProvider.enqueueNotification).toBe("function");
        expect(typeof qstashProvider.enqueuePayment).toBe("function");
    });
});
