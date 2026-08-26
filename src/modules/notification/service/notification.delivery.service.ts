import {
    Notification,
    NotificationChannel,
} from "@prisma/client";

import {
    emailNotificationProvider,
} from "../providers/email.provider";

import {
    pushNotificationProvider,
} from "../providers/push.provider";


export class NotificationDeliveryService {

    async deliver(
        notification: Notification
    ): Promise<void> {

        switch (notification.channel) {

            case NotificationChannel.IN_APP:

                await this.deliverInApp(
                    notification
                );

                break;


            case NotificationChannel.EMAIL:

                await emailNotificationProvider.send(
                    notification
                );

                break;


            case NotificationChannel.PUSH:

                await pushNotificationProvider.send(
                    notification
                );

                break;


            default:

                throw new Error(
                    `Unsupported notification channel: ${notification.channel}`
                );
        }
    }


    private async deliverInApp(
        notification: Notification
    ): Promise<void> {

        /*
         * IN_APP notification is already stored
         * in the database.
         *
         * No external provider is required.
         */

        return;
    }
}


export const notificationDeliveryService =
    new NotificationDeliveryService();