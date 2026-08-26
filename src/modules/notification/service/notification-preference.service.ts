import { NotificationChannel, NotificationPreference } from "@prisma/client";
import { notificationPreferenceRepository } from "../repositories/notification-preference.repository";

export interface UpdateNotificationPreferenceDTO {
    inApp?: boolean;
    email?: boolean;
    push?: boolean;
}

export class NotificationPreferenceService {
    async getPreferences(
        userId: string,
    ): Promise<NotificationPreference> {
        let preference = await notificationPreferenceRepository.findByUserId(
            userId
        );

        if(!preference) {
            preference = await notificationPreferenceRepository.createDefault(
                userId
            );
        } 

        return preference!;
    }

    async updatePreferences(
        userId: string,
        dto: UpdateNotificationPreferenceDTO
    ): Promise<NotificationPreference> {
        return notificationPreferenceRepository.upsert(
            userId,
            dto
        )
    }

    async isEnabled(
        userId: string,
        channel: NotificationChannel
    ): Promise<boolean> {
        const preference = await this.getPreferences(userId);

        switch(channel) {
            case NotificationChannel.IN_APP:
                return preference.inApp;
            case NotificationChannel.EMAIL:
                return preference.email;
            case NotificationChannel.PUSH:
                return preference.push;

            default: 
            return false;
        }
    }
}

export const notificationPreferenceService = new NotificationPreferenceService();