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

if (!env.WITHDRAWAL_WEBHOOK_SECRET || env.WITHDRAWAL_WEBHOOK_SECRET === '') {
    throw new Error('WITHDRAWAL_WEBHOOK_SECRET not configured');
}

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