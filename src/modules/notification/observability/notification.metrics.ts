import { Counter, Gauge, Histogram } from "prom-client";

import { register } from "../../../shared/metrics/metrics";
import { notificationQueue } from "../queue/notification.queue";

export const notificationCreatedCounter =
    new Counter({
        name: "notification_created_total",
        help: "Total notification created",
        labelNames: [
            "type",
            "channel",
        ],
        registers: [
            register,
        ],
    });

export const notificationSentCreatedCounter =
    new Counter({
        name: "notification_sent_total",
        help: "Total notification successfully deliverd",
        labelNames: [
            "type",
            "channel",
        ],
        registers: [
            register,
        ],
    });

export const notificationFailedCounter =
    new Counter({
        name: "notification_failed_total",
        help: "Total notification delivery failed",
        labelNames: [
            "type",
            "channel",
        ],
        registers: [
            register,
        ],
    });

export const notificationSkippedCounter =
    new Counter({
        name: "notification_skipped_total",
        help: "Total notification skipped",
        labelNames: [
            "type",
            "channel",
            "reason",
        ],
        registers: [
            register,
        ],
    });

export const notificationRetryCounter =
    new Counter({
        name: "notification_retry_total",
        help: "Total notification retries",
        labelNames: [
            "type",
            "channel",
        ],
        registers: [
            register,
        ],
    });

export const notificationDLQCounter =
    new Counter({
        name: "notification_dlq_total",
        help: "Total notifications moved to DLQ",
        labelNames: [
            "type",
            "channel",
        ],
        registers: [
            register,
        ],
    });

export const notificationDeliveryDuration =
    new Histogram({
        name: "notification_delivery_duration_seconds",
        help: "Notification delivery duration in seconds",
        labelNames: [
            "type",
            "channel",
        ],
        buckets: [
            0.05,
            0.1,
            0.25,
            0.5,
            1,
            2,
            5,
            10,
        ],
        registers: [
            register,
        ],
    });

export const notificationQueueWaitingGauge =
    new Gauge({
        name: "notification_queue_waiting",
        help: "Number of waiting notification jobs",
        registers: [
            register,
        ],
    });

export const notificationQueueActiveGauge =
    new Gauge({
        name: "notification_queue_active",
        help: "Number of active notification jobs",
        registers: [
            register,
        ],
    });

export const notificationQueueFailedGauge =
    new Gauge({
        name: "notification_queue_failed",
        help: "Number of failed notification jobs",
        registers: [
            register,
        ],
    });

export async function updateNotificationQueueMetrics() {
    try {
        const counts = await notificationQueue.getJobCounts(
            "waiting",
            "active",
            "failed"
        );

        notificationQueueWaitingGauge.set(counts.waiting ?? 0);
        notificationQueueActiveGauge.set(counts.active ?? 0);
        notificationQueueFailedGauge.set(counts.failed ?? 0);
    } catch (error) {
        console.warn("Failed to update notification queue metrics", error);
    }
}

let notificationQueueMetricInterval: NodeJS.Timeout | null = null;

export function startNotificationQueueMetricCollector(intervalMs = 15_000) {
    if (notificationQueueMetricInterval) {
        return notificationQueueMetricInterval;
    }

    notificationQueueMetricInterval = setInterval(() => {
        void updateNotificationQueueMetrics();
    }, intervalMs);

    void updateNotificationQueueMetrics();

    return notificationQueueMetricInterval;
}

export function stopNotificationQueueMetricCollector() {
    if (!notificationQueueMetricInterval) {
        return;
    }

    clearInterval(notificationQueueMetricInterval);
    notificationQueueMetricInterval = null;
}