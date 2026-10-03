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
import { NotificationType } from "../types/notification.types";
import { topupSuccessTemplate } from "../templates/topup-success.template";
import { transferSentTemplate } from "../templates/transfer-sent.template";
import { transferReceivedTemplate } from "../templates/transfer-received.template";
import { withdrawalSuccessTemplate } from "../templates/withdrawal-success.template";


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

        // Use template-based HTML emails for financial notifications
        const htmlContent = this.getEmailContent(notification);

        await emailService.send(
            user.email,
            notification.title,
            htmlContent
        );
    }

    private getEmailContent(notification: Notification): string {
        const metadata = notification.metadata as Record<string, any> | null;

        switch (notification.type) {
            case NotificationType.TOPUP_SUCCESS:
                if (metadata?.amount && metadata?.referenceNumber) {
                    return topupSuccessTemplate({
                        amount: this.formatAmount(metadata.amount),
                        referenceNumber: metadata.referenceNumber,
                        timestamp: notification.createdAt,
                    });
                }
                break;

            case NotificationType.TRANSFER_SUCCESS:
                if (metadata?.amount && metadata?.fee && metadata?.recipientAccountNumber && metadata?.referenceNumber) {
                    return transferSentTemplate({
                        amount: this.formatAmount(metadata.amount),
                        fee: this.formatAmount(metadata.fee),
                        recipientAccountNumber: metadata.recipientAccountNumber,
                        referenceNumber: metadata.referenceNumber,
                        timestamp: notification.createdAt,
                    });
                }
                break;

            case NotificationType.TRANSFER_RECEIVED:
                if (metadata?.amount && metadata?.senderAccountNumber && metadata?.referenceNumber) {
                    return transferReceivedTemplate({
                        amount: this.formatAmount(metadata.amount),
                        senderAccountNumber: metadata.senderAccountNumber,
                        referenceNumber: metadata.referenceNumber,
                        timestamp: notification.createdAt,
                    });
                }
                break;

            case NotificationType.WITHDRAW_SUCCESS:
                if (metadata?.amount && metadata?.fee && metadata?.netAmount && metadata?.bankName && metadata?.accountNumber && metadata?.referenceNumber) {
                    return withdrawalSuccessTemplate({
                        amount: this.formatAmount(metadata.amount),
                        fee: this.formatAmount(metadata.fee),
                        netAmount: this.formatAmount(metadata.netAmount),
                        bankName: metadata.bankName,
                        accountNumber: metadata.accountNumber,
                        referenceNumber: metadata.referenceNumber,
                        timestamp: notification.createdAt,
                    });
                }
                break;
        }

        // Fallback to plain text for non-financial or incomplete metadata
        return this.plainTextFallback(notification);
    }

    private formatAmount(amount: string | number): string {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return num.toLocaleString('id-ID');
    }

    private plainTextFallback(notification: Notification): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #333333;">${notification.title}</h2>
                            <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">${notification.message}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();
    }
}


export const emailNotificationProvider =
    new EmailNotificationProvider();