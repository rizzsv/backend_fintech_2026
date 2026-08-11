import axios from "axios";
import {env} from "../../../shared/config/env";
import { WithdrawalPayload, WithdrawalProvider, WithdrawalResult } from "./withdrawal.provider";

export class MidtransPayoutProvider 
implements WithdrawalProvider {
    private client;

    constructor() {
        this.client = axios.create({
            baseURL: env.MIDTRANS_BASE_URL,
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(
                        env.MIDTRANS_SERVER_KEY + ":"
                    ).toString("base64"),
            }
        });
    }

    async withdraw(
        payload: WithdrawalPayload
    ):Promise<WithdrawalResult> {
        
        const response = await this.client.post("/v2/payouts", {
            reference_no: payload.withdrawalId,
            amount: payload.amount,
            bank_account: {
                bank_name: payload.bankCode,
                account_number: payload.accountNumber,
                account_holder_name: payload.accountName
            }
        });

        return {
            success: true,
            status: "PENDING",
            providerReference: response.data.reference_no,
            response: response.data
        }
    };

    async checkStatus(
        providerReference: string
    ) {

        const response = await this.client.get(`/v2/payouts/${providerReference}`);

        return {
            success: response.data.status === "SUCCESS",
            status: response.data.status,
            providerReference,
            response: response.data
        }
    }
}