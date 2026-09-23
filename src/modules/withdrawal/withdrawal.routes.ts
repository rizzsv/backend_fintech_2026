import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { validateRequest } from "../../shared/middleware/requestValidator.middleware";
import { idempotencyMiddleware } from "../../shared/idempotency/idempotency.middleware";
import { createWithdrawalSchema } from "./validators/withdrawal.validator";
import { withdrawalController } from "./controllers/withdrawal.controller";

const router = Router();

/**
 * Registered before the create handler so clients can read the authoritative
 * fee and amount bounds instead of duplicating them.
 */
router.get(
    "/config",
    authMiddleware,
    withdrawalController.config.bind(withdrawalController)
);

router.post(
    "/",
    authMiddleware,
    validateRequest(createWithdrawalSchema),
    idempotencyMiddleware,
    withdrawalController.create.bind(withdrawalController)
);

export default router;