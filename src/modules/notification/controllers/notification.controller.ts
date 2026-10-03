import { Request, Response } from "express";
import { notificationService } from "../service/notification.service";

export class NotificationController {
    async list(req: Request, res: Response) {
        const userId = req.user!.id;
        const { limit = 20, offset = 0, unreadOnly } = req.query;

        const notifications = await notificationService.getUserNotifications(
            userId,
            {
                limit: Math.min(Number(limit) || 20, 100),
                offset: Number(offset) || 0,
                unreadOnly: unreadOnly === "true",
            }
        );

        return res.json({
            success: true,
            data: notifications,
        });
    }

    async getUnreadCount(req: Request, res: Response) {
        const userId = req.user!.id;

        const count = await notificationService.getUnreadCount(userId);

        return res.json({
            success: true,
            data: { count },
        });
    }

    async markAsRead(req: Request, res: Response) {
        const userId = req.user!.id;
        const id = req.params.id as string;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Notification ID is required",
            });
        }

        const notification = await notificationService.markAsRead(id, userId);

        return res.json({
            success: true,
            data: notification,
        });
    }

    async markAllAsRead(req: Request, res: Response) {
        const userId = req.user!.id;

        const count = await notificationService.markAllAsRead(userId);

        return res.json({
            success: true,
            data: { count },
            message: `${count} notifications marked as read`,
        });
    }
}

export const notificationController = new NotificationController();
