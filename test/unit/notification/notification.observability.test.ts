import { describe, expect, it } from "vitest";

import { register } from "../../../src/shared/metrics/metrics";

import {
    notificationCreatedCounter,
    notificationDeliveryDuration,
    notificationQueueActiveGauge,
    notificationQueueFailedGauge,
    notificationQueueWaitingGauge,
} from "../../../src/modules/notification/observability/notification.metrics";

describe("notification observability", () => {
    it("registers notification metrics with the app registry", async () => {
        const metrics = await register.getMetricsAsJSON();
        const metricNames = metrics.map((metric: { name: string }) => metric.name);

        expect(notificationCreatedCounter).toBeDefined();
        expect(notificationDeliveryDuration).toBeDefined();
        expect(notificationQueueWaitingGauge).toBeDefined();
        expect(notificationQueueActiveGauge).toBeDefined();
        expect(notificationQueueFailedGauge).toBeDefined();

        expect(metricNames).toContain("notification_created_total");
        expect(metricNames).toContain("notification_delivery_duration_seconds");
        expect(metricNames).toContain("notification_queue_waiting");
        expect(metricNames).toContain("notification_queue_active");
        expect(metricNames).toContain("notification_queue_failed");
    });
});
