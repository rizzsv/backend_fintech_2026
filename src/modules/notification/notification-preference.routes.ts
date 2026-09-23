import { Router } from "express";
import { notificationPreferenceController } from "./controllers/notification-preference.controller";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { validateRequest } from "../../shared/middleware/requestValidator.middleware";
import { updateNotificationPreferenceSchema } from "./validators/notification.validator";




const router =
    Router();


router.get(
    "/preferences",
    authMiddleware,
    notificationPreferenceController.get.bind(
        notificationPreferenceController
    )
);


router.patch(
    "/preferences",
    authMiddleware,
    validateRequest(updateNotificationPreferenceSchema),
    notificationPreferenceController.update.bind(
        notificationPreferenceController
    )
);


export default router;