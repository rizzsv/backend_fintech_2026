import { Router } from "express";
import {
    transactionQuerySchema,
    transferSchema,
} from "./validators/transaction.validator";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { validateRequest } from "../../shared/middleware/requestValidator.middleware";
import { transactionController } from "./controllers/transaction.controller";



const router = Router();

router.use(authMiddleware);

router.get(
    "/",
    validateRequest(transactionQuerySchema, "query"),
    transactionController.getTransactions.bind(
        transactionController
    )
);

router.get(
    "/:id",
    transactionController.getTransactionById.bind(
        transactionController
    )
);

router.post(
    "/transfer",
    validateRequest(transferSchema.omit({ idempotencyKey: true }), "body"),
    transactionController.transfer
);

export default router;