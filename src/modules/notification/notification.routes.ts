import { Router } from "express";
import { notificationController } from "./controllers/notification.controller";
import { notificationPreferenceController } from "./controllers/notification-preference.controller";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { validateRequest } from "../../shared/middleware/requestValidator.middleware";
import { updateNotificationPreferenceSchema } from "./validators/notification.validator";

const router = Router();

// Notification list and actions
router.get(
    "/",
    authMiddleware,
    notificationController.list.bind(notificationController)
);

router.get(
    "/unread-count",
    authMiddleware,
    notificationController.getUnreadCount.bind(notificationController)
);

router.patch(
    "/:id/read",
    authMiddleware,
    notificationController.markAsRead.bind(notificationController)
);

router.patch(
    "/read-all",
    authMiddleware,
    notificationController.markAllAsRead.bind(notificationController)
);

// Preferences
router.get(
    "/preferences",
    authMiddleware,
    notificationPreferenceController.get.bind(notificationPreferenceController)
);

router.patch(
    "/preferences",
    authMiddleware,
    validateRequest(updateNotificationPreferenceSchema),
    notificationPreferenceController.update.bind(notificationPreferenceController)
);

export default router;
