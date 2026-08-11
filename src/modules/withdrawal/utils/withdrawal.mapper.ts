import { Withdrawal } from "@prisma/client";
import {
    WithdrawalResponse
} from "../types/withdrawal.types";


export const formatWithdrawalResponse = (
    withdrawal: Withdrawal
): WithdrawalResponse => {

    return {
        withdrawalId: withdrawal.id,

        referenceNumber:
            withdrawal.referenceNumber,

        status:
            withdrawal.status,

        amount:
            withdrawal.amount.toNumber(),

        fee:
            withdrawal.fee.toNumber(),

        netAmount:
            withdrawal.netAmount.toNumber(),
    };

};