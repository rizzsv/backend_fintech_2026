import { Request, Response } from "express";
import { BusinessLogger } from "../../../shared/logger/business-logger";
import { notificationRepository } from "../repositories/notification.repository";
import { getQStashRetryInfo } from "../../../shared/queue/qstash.middleware";
import { NotificationStatus } from "@prisma/client";
import { notificationDeliveryService } from "../service/notification.delivery.service";

/**
 * QStash HTTP endpoint for notification delivery
 * Called by QStash instead of BullMQ worker when QUEUE_PROVIDER=qstash
 */
export const notificationWorkerController = {
    async processNotification(req: Request, res: Response): Promise<void> {
        try {
            const { notificationId } = req.body;

            if (!notificationId || typeof notificationId !== "string") {
                res.status(400).json({ error: "notificationId is required" });
                return;
            }

            const retryInfo = getQStashRetryInfo(req);

            BusinessLogger.info("QStash notification worker triggered", {
                notificationId,
                retryCount: retryInfo.retryCount,
            });

            const notification = await notificationRepository.findById(notificationId);

            if (!notification) {
                BusinessLogger.error("Notification not found", { notificationId });
                res.status(200).json({ success: false, error: "Notification not found" });
                return;
            }

            // Idempotency: already sent
            if (notification.status === NotificationStatus.SENT) {
                BusinessLogger.info("Notification already sent", { notificationId });
                res.status(200).json({ success: true, alreadySent: true });
                return;
            }

            // Mark as processing
            await notificationRepository.markProcessing(notificationId);

            try {
                // Actual delivery via existing service (EMAIL/PUSH/SMS based on channel)
                await notificationDeliveryService.deliver(notification);

                // Mark as sent
                await notificationRepository.updateStatus(notificationId, NotificationStatus.SENT);

                BusinessLogger.info("QStash notification worker completed", {
                    notificationId,
                    retryCount: retryInfo.retryCount,
                    channel: notification.channel,
                });

                res.status(200).json({ success: true });
            } catch (deliveryError) {
                // Delivery failed - mark as failed and let QStash retry
                await notificationRepository.updateStatus(notificationId, NotificationStatus.FAILED);
                
                BusinessLogger.error("Notification delivery failed", {
                    notificationId,
                    error: deliveryError instanceof Error ? deliveryError.message : String(deliveryError),
                });

                throw deliveryError;
            }
        } catch (error) {
            BusinessLogger.error("QStash notification worker failed", {
                notificationId: req.body?.notificationId,
                error: error instanceof Error ? error.message : String(error),
            });

            // Mark as failed
            if (req.body?.notificationId) {
                await notificationRepository
                    .updateStatus(req.body.notificationId, NotificationStatus.FAILED)
                    .catch(() => {});
            }

            // Return 200 to prevent retry for business logic errors
            res.status(200).json({
                success: false,
                error: error instanceof Error ? error.message : "Notification delivery failed",
            });
        }
    },
};
