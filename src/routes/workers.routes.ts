import { Router } from "express";
import { withdrawalWorkerController } from "../modules/withdrawal/controllers/withdrawal-worker.controller";
import { notificationWorkerController } from "../modules/notification/controllers/notification-worker.controller";
import { paymentWorkerController } from "../modules/payment/controllers/payment-worker.controller";
import { reconciliationWorkerController } from "../modules/withdrawal/controllers/reconciliation-worker.controller";

const router = Router();

/**
 * QStash worker endpoints
 * All routes require QStash signature verification middleware (added in app.ts)
 */

router.post("/withdrawal", withdrawalWorkerController.processWithdrawal);
router.post("/notification", notificationWorkerController.processNotification);
router.post("/payment/:jobType", paymentWorkerController.processPaymentJob);
router.post("/reconciliation", reconciliationWorkerController);

export default router;
