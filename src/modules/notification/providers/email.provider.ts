import {
    Notification,
} from "@prisma/client";

import {
    NotificationProvider,
} from "./notification.provider";

import {
    BusinessLogger,
} from "../../../shared/logger/business-logger";
import { emailService } from "../service/email.service";
import { prisma } from "../../../shared/config/database";


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

        const user = await prisma.user.findUnique({
            where: { id: notification.userId },
            select: { email: true },
        });

        if (!user) {
            throw new Error(`User ${notification.userId} not found`);
        }

        await emailService.send(
            user.email,
            notification.title,
            notification.message
        );
    }
}


export const emailNotificationProvider =
    new EmailNotificationProvider();