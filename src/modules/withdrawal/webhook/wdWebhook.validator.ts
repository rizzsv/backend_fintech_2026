import crypto from "crypto";

import {
env
}
from "../../../shared/config/env";


export class WithdrawalWebhookValidator {


verify(
payload:any,
signature:string
){

const hash =
crypto
.createHmac(
"sha256",
env.WITHDRAWAL_WEBHOOK_SECRET
)
.update(
JSON.stringify(payload)
)
.digest("hex");



if(hash !== signature){

    throw new Error(
        "Invalid webhook signature"
    );

}


return true;


}


}


export const withdrawalWebhookValidator =
new WithdrawalWebhookValidator();