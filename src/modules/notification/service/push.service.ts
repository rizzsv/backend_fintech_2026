import { BusinessLogger } from '../../../shared/logger/business-logger';

export class PushService {
    async send(
        userId: string,
        title: string,
        message: string
    ): Promise<void> {
        BusinessLogger.info(`Sending push notification to user ${userId}: ${title} - ${message}`),
        {
            userId,
            title,
            message
        }
    }
}

export const pushService = new PushService();