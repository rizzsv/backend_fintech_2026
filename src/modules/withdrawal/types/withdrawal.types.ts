import { WithdrawalMethod } from "@prisma/client";

export interface CreateWithdrawalDTO {

    amount: number;

    method: WithdrawalMethod;

    bankCode?: string;

    accountNumber?: string;

    accountName?: string;

}

export interface WithdrawalResponse {

    withdrawalId: string;

    referenceNumber: string;

    status: string;

    amount: number;

    fee: number;

    netAmount: number;

}

export interface CreateWithdrawalDTO {
    amount: number;
    method: WithdrawalMethod;
    bankCode?: string;
    accountNumber?: string;
    accountName?: string;
    idempotencyKey: string;
}