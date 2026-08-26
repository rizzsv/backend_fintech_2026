import {
    Notification,
} from "@prisma/client";

import {
    NotificationProvider,
} from "./notification.provider";

import {
    BusinessLogger,
} from "../../../shared/logger/business-logger";


export class PushNotificationProvider
    implements NotificationProvider {

    async send(
        notification: Notification
    ): Promise<void> {

        BusinessLogger.info(
            "Sending push notification",
            {
                notificationId: notification.id,
                userId: notification.userId,
                type: notification.type,
            }
        );

        /*
         * TODO:
         *
         * Integrate push provider.
         *
         * Example:
         * - Firebase Cloud Messaging
         * - OneSignal
         */

        return;
    }
}


export const pushNotificationProvider =
    new PushNotificationProvider();