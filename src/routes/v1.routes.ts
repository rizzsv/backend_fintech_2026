import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import walletRoutes from "../modules/wallet/wallet.routes";
import transactionRoutes from "../modules/transaction/transaction.route";
import paymentRoutes from "../modules/payment/payment.routes";
import { withdrawalWebhookController } from "../modules/withdrawal/webhook/withdrawal-webhook.controller";


const router = Router();

router.use("/auth", authRoutes);
router.use("/wallet", walletRoutes);
router.use("/transaction", transactionRoutes);
router.use("/payment", paymentRoutes);

// post
router.post("/withdrawal/webhook", withdrawalWebhookController.handle);



export default router;