import { Request, Response } from "express";
import { withdrawalWebhookValidator } from "../webhook/wdWebhook.validator";
import { withdrawalWebhookService } from "../webhook/withdrawal-webhook.service";



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

    async create(
        req: Request,
        res: Response
    ) {

        return res.json({
            message: "Coming soon",
        });

    }

}

export const withdrawalController =
    new WithdrawalController();