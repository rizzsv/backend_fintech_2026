import { Router } from "express";
import {
    transactionQuerySchema,
    transferBodySchema,
    transferSchema,
} from "./validators/transaction.validator";
import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { validateRequest } from "../../shared/middleware/requestValidator.middleware";
import { transactionController } from "./controllers/transaction.controller";



const router = Router();

router.use(authMiddleware);

/**
 * Must stay above `GET /:id`, otherwise "config" is read as a transaction id.
 */
router.get(
    "/config",
    transactionController.config.bind(
        transactionController
    )
);

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
    validateRequest(transferBodySchema, "body"),
    transactionController.transfer.bind(
        transactionController
    )
);

export default router;