import midtransClient from "midtrans-client";
import crypto from "crypto";
import { env } from "../../../shared/config/env";
import axios from "axios";

class MidtransProvider {

    private snap: midtransClient.Snap | null = null;
    private core: midtransClient.CoreApi | null = null;

    private ensureInitialized() {
        if (env.PAYMENT_MODE === 'simulated') {
            throw new Error('Midtrans provider should not be called in simulated mode');
        }
        
        if (!env.MIDTRANS_SERVER_KEY || !env.MIDTRANS_CLIENT_KEY) {
            throw new Error('Midtrans credentials not configured');
        }

        if (!this.snap) {
            this.snap = new midtransClient.Snap({
                isProduction: env.MIDTRANS_IS_PRODUCTION,
                serverKey: env.MIDTRANS_SERVER_KEY,
                clientKey: env.MIDTRANS_CLIENT_KEY,
            });
        }

        if (!this.core) {
            this.core = new midtransClient.CoreApi({
                isProduction: env.MIDTRANS_IS_PRODUCTION,
                serverKey: env.MIDTRANS_SERVER_KEY,
                clientKey: env.MIDTRANS_CLIENT_KEY,
            });
        }
    }

    getSnap() {
        this.ensureInitialized();
        return this.snap!;
    }

    async createTransaction(parameter: any) {
        this.ensureInitialized();
        return this.snap!.createTransaction(parameter);
    }

async getTransaction(orderId: string) {
        this.ensureInitialized();

        const response = await fetch(

            `${env.MIDTRANS_BASE_URL!}/v2/${orderId}/status`,

            {
                method: "GET",

                headers: {
                    Authorization:
                        "Basic " +
                        Buffer.from(
                            env.MIDTRANS_SERVER_KEY! + ":"
                        ).toString("base64"),
                },
            }

        );

        if (!response.ok) {
            throw new Error("Failed to fetch transaction");
        }

        return response.json();
    }

    async cancelTransaction(orderId: string) {
        this.ensureInitialized();

        const response = await fetch(

            `${env.MIDTRANS_BASE_URL!}/v2/${orderId}/cancel`,

            {
                method: "POST",

                headers: {
                    Authorization:
                        "Basic " +
                        Buffer.from(
                            env.MIDTRANS_SERVER_KEY! + ":"
                        ).toString("base64"),
                },
            }

        );

        return response.json();
    }

    async expireTransaction(orderId: string) {
        this.ensureInitialized();

        const response = await fetch(

            `${env.MIDTRANS_BASE_URL!}/v2/${orderId}/expire`,

            {
                method: "POST",

                headers: {
                    Authorization:
                        "Basic " +
                        Buffer.from(
                            env.MIDTRANS_SERVER_KEY! + ":"
                        ).toString("base64"),
                },
            }

        );

        return response.json();
    }


    verifySignature(payload: any): boolean {
        this.ensureInitialized();

        const signature =
            crypto
                .createHash("sha512")
                .update(
                    payload.order_id +
                    payload.status_code +
                    payload.gross_amount +
                    env.MIDTRANS_SERVER_KEY!
                )
                .digest("hex");

        return signature === payload.signature_key;
    }

}

export const midtransProvider = new MidtransProvider();