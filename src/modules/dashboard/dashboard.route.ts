import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { dashboardController } from "./controllers/dashboard.controller";

const router = Router();

router.get(
    "/dashboard",
    authMiddleware,
    dashboardController.getDashboard.bind(dashboardController)
);

export default router;