import { Notification } from "@prisma/client";
export interface NotificationProvider {
    send(
        notification: Notification,
    ): Promise<void>;
}