import { verificationTemplate } from "../templates/email-verification";
import { transferSuccessTemplate } from "../templates/transfer-success";
import { TransferSuccessPayload, NotificationJob, CreateNotificationInput, NotificationResponse } from "../types/notification.types";
import { emailService } from "./email.service";
import { NOTIFICATION_JOB, notificationQueue } from "../queue/notification.queue";
import { Prisma, Notification, NotificationStatus } from "@prisma/client";
import { notificationRepository } from "../repositories/notification.repository";
import { notificationPreferenceService } from "./notification-preference.service";
import { BusinessLogger } from "../../../shared/logger/business-logger";
import { notificationRateLimitService } from "../security/notification-rate-limit.service";
import { notificationDeduplicationService } from "../security/notification-deduplication.service";
import { notificationCreatedCounter, notificationSkippedCounter } from "../observability/notification.metrics";
import { tracer } from "../../../shared/telemetry/tracer";

export class NotificationService {
    private toResponse(notification: Notification): NotificationResponse {
        return {
            id: notification.id,
            userId: notification.userId,
            type: notification.type,
            channel: notification.channel,
            status: notification.status,
            title: notification.title,
            message: notification.message,
            resource: notification.resource,
            entityId: notification.entityId,
            isRead: notification.isRead,
            readAt: notification.readAt,
            sentAt: notification.sentAt,
            createdAt: notification.createdAt,
        };
    }

    async transferSuccess(
        email: string,
        payload: TransferSuccessPayload
    ) {

        return emailService.send(

            email,

            "Transfer Successful",

            transferSuccessTemplate(payload)

        );

    }

    // async publish(
    //     job: NotificationJob
    // ) {
    //     return notificationQueue.add(
    //         job.type,
    //         job.data
    //         )
    //     }

    async sendVerificationEmail(
        email: string,
        verificationUrl: string
    ) {
        return emailService.send(
            email,
            "Verify Your Email",
            verificationTemplate({
                verificationUrl,
            })
        );
    }

    async createNotification(
        input: CreateNotificationInput,
        tx?: Prisma.TransactionClient
    ): Promise<NotificationResponse> {
        const span = tracer.startSpan("notification.create");
        span.setAttribute("notification.type", input.type);
        span.setAttribute("notification.channel", input.channel);

        try {
            const enabled =
                await notificationPreferenceService.isEnabled(
                    input.userId,
                    input.channel
                );

            let status = NotificationStatus.SKIPPED;

            if (!enabled) {

                notificationSkippedCounter.inc({
                    type: input.type,
                    channel: input.channel,
                    reason: "PREFERENCE_DISABLED",
                });

                BusinessLogger.info(
                    "Notification skipped by user preference",
                    {
                        userId: input.userId,
                        channel: input.channel,
                        type: input.type,
                    }
                );
            } else {
                const allowed = await notificationRateLimitService.check(
                    input.userId,
                    input.type
                );

                if (allowed) {

                    notificationSkippedCounter.inc({
                        type: input.type,
                        channel: input.channel,
                        reason: "RATE_LIMIT",
                    });

                    status = NotificationStatus.SKIPPED;
                } else {
                    BusinessLogger.warn(
                        "Notification skipped because rate limit was exceeded",
                        {
                            userId: input.userId,
                            type: input.type,
                            channel: input.channel,
                        }
                    );
                }

                const duplicate = await notificationDeduplicationService.isDuplicate(
                    input.userId,
                    input.type,
                    input.channel,
                    input.resource,
                    input.entityId
                );

                if (duplicate) {

                    notificationSkippedCounter.inc({
                        type: input.type,
                        channel: input.channel,
                        reason: "DUPLICATE",
                    });

                    BusinessLogger.warn(
                        "Notification skipped because it is a duplicate",
                        {
                            userId: input.userId,
                            type: input.type,
                            channel: input.channel,
                            resource: input.resource,
                            entityId: input.entityId,
                        }
                    )
                }
            }

            const notification = await notificationRepository.create(
                {
                    ...input,
                    status: NotificationStatus.SKIPPED,
                },
                tx
            );

            notificationCreatedCounter.inc({
                type: input.type,
                channel: input.channel,
            })

            if (status === NotificationStatus.SKIPPED) {
                return this.toResponse(notification);
            }

            const queueSpan = tracer.startSpan("notification.queue");
            queueSpan.setAttribute("notification.type", input.type);
            queueSpan.setAttribute("notification.channel", input.channel);

            try {
                await notificationQueue.add(
                    NOTIFICATION_JOB,

                    {
                        notificationId:
                            notification.id,
                    },

                    {
                        jobId:
                            `notification:${notification.id}`,
                    }
                );
            } finally {
                queueSpan.end();
            }

            return this.toResponse(
                notification
            );
        } finally {
            span.end();
        }
    }

    async getById(
        id: string
    ): Promise<NotificationResponse> {
        const notification = await notificationRepository.findById(id);

        if (!notification) {
            throw new Error("Notification not found");
        }

        return this.toResponse(notification);
    }

    async getUserNotifications(
        userId: string,
        options?: {
            limit?: number;
            offset?: number;
            unreadOnly?: boolean;
        }
    ): Promise<NotificationResponse[]> {

        const notifications =
            await notificationRepository.findByUserId(
                userId,
                options
            );

        return notifications.map(
            (notification) =>
                this.toResponse(notification)
        );
    }

    async markAsRead(
        id: string,
        userId: string
    ): Promise<NotificationResponse> {
        const notification = await notificationRepository.markAsRead(id, userId);

        return this.toResponse(notification);
    }

    async markAllAsRead(
        userId: string
    ): Promise<Number> {
        const result = await notificationRepository.markAllAsRead(userId);

        return result.count;
    }

    async updateStatus(
        id: string,
        status: NotificationStatus,
        options?: {
            failedReason?: string;
            retryCount?: number;
        }
    ): Promise<NotificationResponse> {
        const notification = await notificationRepository.updateStatus(
            id,
            status,
            options
        );

        return this.toResponse(notification);
    }

    async markProcessing(
        id: string
    ): Promise<NotificationResponse> {
        const notification = await notificationRepository.markProcessing(
            id
        );

        return this.toResponse(notification);
    }

    async incrementRetry(
        id: string
    ): Promise<NotificationResponse> {
        const notification = await notificationRepository.incrementRetry(
            id
        );

        return this.toResponse(notification);
    }

}

export const notificationService =
    new NotificationService();