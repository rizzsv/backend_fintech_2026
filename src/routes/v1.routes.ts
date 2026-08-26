import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import walletRoutes from "../modules/wallet/wallet.routes";
import transactionRoutes from "../modules/transaction/transaction.route";
import paymentRoutes from "../modules/payment/payment.routes";
import notificationRoutes from "../modules/notification/notification-preference.routes";
import { withdrawalWebhookController } from "../modules/withdrawal/webhook/withdrawal-webhook.controller";


const router = Router();

router.use("/auth", authRoutes);
router.use("/wallet", walletRoutes);
router.use("/transaction", transactionRoutes);
router.use("/payment", paymentRoutes);
router.use("/notifications", notificationRoutes);

// post
router.post("/withdrawal/webhook", withdrawalWebhookController.handle);



export default router;