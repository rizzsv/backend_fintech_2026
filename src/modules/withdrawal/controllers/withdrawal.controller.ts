import { Request, Response, NextFunction } from "express";
import { withdrawalWebhookValidator } from "../webhook/wdWebhook.validator";
import { withdrawalWebhookService } from "../webhook/withdrawal-webhook.service";
import { withdrawalService } from "../services/withdrawal.service";

export class WithdrawalController {

    async handle(
        req: Request,
        res: Response
    ) {
        const signature = req.headers["x-withdrawal-signature"] as string;

        if (!signature) {
            return res.status(401).json({
                success: false,
                message: "Missing signature header",
            })
        }

        withdrawalWebhookValidator.verify(
            req.body,
            signature
        );

        await withdrawalWebhookService.handle(
            req.body
        );

        return res.json({
            success: true,
            message: "Webhook processed successfully",
        })
    }

async config(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        return res.json({
            success: true,
            data: withdrawalService.getConfig(),
        });
    } catch (error) {
        next(error);
    }
}

async create(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const idempotencyKey =
            req.headers["idempotency-key"] as string;

        const result =
            await withdrawalService.createWithdrawal(
                req.user!.id,
                {
                    ...req.body,
                    idempotencyKey,
                }
            );

        return res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

}

export const withdrawalController =
    new WithdrawalController();