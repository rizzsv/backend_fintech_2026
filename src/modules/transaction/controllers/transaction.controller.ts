import { Request, Response, NextFunction } from "express";

import { transactionService } from "../services/transaction.service";

import { ResponseUtils } from "../../../shared/utils/response.utils";

import { AppError } from "../../../shared/errors/AppError";
import { TransactionQueryDTO } from "../types/transaction.types";

interface TransactionParams {
    id: string;
}

export class TransactionController {

    async getTransactions(
        req: Request,
        res: Response,
        next: NextFunction
    ) {

  try {
    const query = (req as any).validatedQuery;

    const result = await transactionService.getTransactions(
      req.user!.id,
      query
    );

    return ResponseUtils.success(
      res,
      result,
      "Transactions fetched successfully"
    );
  } catch (error) {
    next(error);
  }

    }

    async getTransactionById(
        req: Request<TransactionParams>,
        res: Response,
        next: NextFunction
    ) {

        try {

            const result =
                await transactionService.getTransactionDetail(
                    req.user!.id,
                    req.params.id
                );

            return ResponseUtils.success(
                res,
                result,
                "Transaction fetched successfully"
            );

        } catch (error) {

            next(error);

        }

    }

    async transfer(
        req: Request,
        res: Response,
        next: NextFunction
    ) {

        try {

            if (!req.user) {
                throw new AppError(
                    "Unauthorized",
                    401,
                    "UNAUTHORIZED"
                );
            }

            const idempotencyKey =
                req.header("Idempotency-Key");

            if (!idempotencyKey) {
                throw new AppError(
                    "Idempotency-Key header is required",
                    400,
                    "IDEMPOTENCY_KEY_REQUIRED"
                );
            }

            const dto = {
                ...req.body,
                idempotencyKey,
            };

            const result =
                await transactionService.transfer(
                    req.user.id,
                    dto
                );

            return ResponseUtils.success(
                res,
                result,
                "Transfer completed successfully"
            );

        } catch (error) {

            next(error);

        }

    }

}

export const transactionController =
    new TransactionController();