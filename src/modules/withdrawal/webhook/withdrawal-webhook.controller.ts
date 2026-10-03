import { Request, Response, NextFunction } from "express";
import { withdrawalWebhookService } from "./withdrawal-webhook.service";
import { withdrawalWebhookValidator } from "./wdWebhook.validator";
import { withdrawalWebhookSchema } from "./types";
import { AppError } from "../../../shared/errors/AppError";

export class WithdrawalWebhookController {


    async handle(
        req: Request,
        res: Response,
        next: NextFunction
    ) {

        try {
            // Extract signature from header
            const signature = req.headers['x-signature'] as string;

            if (!signature) {
                throw new AppError(
                    "Missing webhook signature",
                    401,
                    "MISSING_SIGNATURE"
                );
            }

            // Validate payload schema
            const validatedPayload = withdrawalWebhookSchema.parse(req.body);

            // Verify signature
            withdrawalWebhookValidator.verify(validatedPayload, signature);

            // Process webhook
            await withdrawalWebhookService.handle(validatedPayload);

            return res.json({
                success: true
            });

        } catch (error) {
            next(error);
        }

    }


}


export const withdrawalWebhookController =
new WithdrawalWebhookController();