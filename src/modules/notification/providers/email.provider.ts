import {
    Notification,
} from "@prisma/client";

import {
    NotificationProvider,
} from "./notification.provider";

import {
    BusinessLogger,
} from "../../../shared/logger/business-logger";


export class EmailNotificationProvider
    implements NotificationProvider {

    async send(
        notification: Notification
    ): Promise<void> {

        BusinessLogger.info(
            "Sending email notification",
            {
                notificationId: notification.id,
                userId: notification.userId,
                type: notification.type,
            }
        );

        /*
         * TODO Sprint 7.x:
         *
         * Integrate SMTP / email provider.
         *
         * Example:
         * - Nodemailer
         * - Resend
         * - SendGrid
         */

        return;
    }
}


export const emailNotificationProvider =
    new EmailNotificationProvider();