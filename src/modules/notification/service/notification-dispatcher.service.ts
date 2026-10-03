import { NotificationChannel, Prisma } from "@prisma/client";
import { prisma } from "../../../shared/config/database";
import { notificationService } from "./notification.service";
import { notificationPreferenceService } from "./notification-preference.service";
import { BusinessLogger } from "../../../shared/logger/business-logger";
import { NotificationType } from "../types/notification.types";

export interface FinancialNotificationPayload {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    resource?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Dispatches financial notifications across all enabled channels (IN_APP, EMAIL, PUSH)
 * based on user preferences.
 */
export class NotificationDispatcherService {
    /**
     * Dispatch notification to all enabled channels for a user.
     * Respects user's notification preferences.
     */
    async dispatchFinancialNotification(
        payload: FinancialNotificationPayload,
        tx?: Prisma.TransactionClient
    ): Promise<void> {
        try {
            const preferences = await notificationPreferenceService.getPreferences(
                payload.userId
            );

            const dispatchPromises: Promise<unknown>[] = [];

            // IN_APP notification
            if (preferences.inApp) {
                dispatchPromises.push(
                    notificationService.createNotification(
                        {
                            userId: payload.userId,
                            type: payload.type,
                            channel: NotificationChannel.IN_APP,
                            title: payload.title,
                            message: payload.message,
                            resource: payload.resource,
                            entityId: payload.entityId,
                            metadata: payload.metadata,
                        },
                        tx
                    )
                );
            }

            // EMAIL notification
            if (preferences.email) {
                dispatchPromises.push(
                    notificationService.createNotification(
                        {
                            userId: payload.userId,
                            type: payload.type,
                            channel: NotificationChannel.EMAIL,
                            title: payload.title,
                            message: payload.message,
                            resource: payload.resource,
                            entityId: payload.entityId,
                            metadata: payload.metadata,
                        },
                        tx
                    )
                );
            }

            // PUSH notification
            if (preferences.push) {
                dispatchPromises.push(
                    notificationService.createNotification(
                        {
                            userId: payload.userId,
                            type: payload.type,
                            channel: NotificationChannel.PUSH,
                            title: payload.title,
                            message: payload.message,
                            resource: payload.resource,
                            entityId: payload.entityId,
                            metadata: payload.metadata,
                        },
                        tx
                    )
                );
            }

            // Execute all channel dispatches in parallel
            await Promise.all(dispatchPromises);

            BusinessLogger.info("Financial notification dispatched", {
                userId: payload.userId,
                type: payload.type,
                channels: {
                    inApp: preferences.inApp,
                    email: preferences.email,
                    push: preferences.push,
                },
            });
        } catch (error) {
            BusinessLogger.error("Failed to dispatch financial notification", {
                userId: payload.userId,
                type: payload.type,
                error: error instanceof Error ? error.message : "Unknown error",
            });

            // Do not throw - notification failure should not block financial operations
        }
    }
}

export const notificationDispatcherService = new NotificationDispatcherService();
