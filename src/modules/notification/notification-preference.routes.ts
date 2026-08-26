import { Router } from "express";
import { notificationPreferenceController } from "./controllers/notification-preference.controller";
import { authMiddleware } from "../../shared/middleware/auth.middleware";




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
    notificationPreferenceController.update.bind(
        notificationPreferenceController
    )
);


export default router;