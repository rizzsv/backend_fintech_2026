import { Request, Response } from "express";
import { withdrawalWebhookService } from "./withdrawal-webhook.service";

export class WithdrawalWebhookController {


    async handle(
        req:Request,
        res:Response
    ){

        await withdrawalWebhookService.handle(
            req.body
        );


        return res.json({

            success:true

        });

    }


}


export const withdrawalWebhookController =
new WithdrawalWebhookController();