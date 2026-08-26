import {Request, Response} from "express";
import { notificationPreferenceService } from "../service/notification-preference.service";


export class NotificationPreferenceController {
    async get(
        req: Request,
        res: Response
    ) {
        const userId = req.user?.id;

        const preferences = await notificationPreferenceService.getPreferences(userId!);
        return res.json({
            success: true,
            data: preferences,
        });
    }

    async update(
        req: Request,
        res: Response
    ) {
        const userId = req.user?.id;

        const preferences = await notificationPreferenceService.updatePreferences(
            userId!,
            req.body
        );

        return res.json({
            success: true,
            data: preferences,
        });
    }
    
}

export const notificationPreferenceController = new NotificationPreferenceController();