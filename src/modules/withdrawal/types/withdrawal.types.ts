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

/**
 * Backend-authoritative withdrawal rules, surfaced so clients can render and
 * pre-validate against the same numbers the service enforces.
 */
export interface WithdrawalConfig {

    fee: number;

    minAmount: number;

    maxAmount: number;

    dailyLimit: number;

    methods: WithdrawalMethod[];

}