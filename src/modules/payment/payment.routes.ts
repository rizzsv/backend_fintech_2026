import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { validateRequest } from "../../shared/middleware/requestValidator.middleware";
import { paymentController } from "./controllers/payment.controller";
import { createPaymentSchema } from "./validators/payment.validator";
import { paymentWebhookController } from "./controllers/paymentWebhook.controller";
import { idempotencyMiddleware } from "../../shared/idempotency/idempotency.middleware";

const router = Router();

router.post(
    "/topup",
    authMiddleware,
    validateRequest(createPaymentSchema),
    idempotencyMiddleware,
    paymentController.createPayment
);

router.get(
    "/:reference/status",
    authMiddleware,
    paymentController.getStatus
);

router.post(
    "/:reference/cancel",
    authMiddleware,
    paymentController.cancelPayment
);

router.post(
    "/webhook",
    paymentWebhookController.handle
);

export default router;