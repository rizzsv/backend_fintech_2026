import midtransClient from "midtrans-client";
import crypto from "crypto";
import { env } from "../../../shared/config/env";
import axios from "axios";

class MidtransProvider {

    private snap = new midtransClient.Snap({
        isProduction: false ,
        serverKey: env.MIDTRANS_SERVER_KEY,
        clientKey: env.MIDTRANS_CLIENT_KEY,
    });

    private core = new midtransClient.CoreApi({
        isProduction: false,
        serverKey: env.MIDTRANS_SERVER_KEY,
        clientKey: env.MIDTRANS_CLIENT_KEY,
    });

    getSnap() {
        return this.snap;
    }

    async createTransaction(parameter: any) {
        return this.snap.createTransaction(parameter);
    }

async getTransaction(orderId: string) {

        const response = await fetch(

            `${env.MIDTRANS_BASE_URL}/v2/${orderId}/status`,

            {
                method: "GET",

                headers: {
                    Authorization:
                        "Basic " +
                        Buffer.from(
                            env.MIDTRANS_SERVER_KEY + ":"
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

        const response = await fetch(

            `${env.MIDTRANS_BASE_URL}/v2/${orderId}/cancel`,

            {
                method: "POST",

                headers: {
                    Authorization:
                        "Basic " +
                        Buffer.from(
                            env.MIDTRANS_SERVER_KEY + ":"
                        ).toString("base64"),
                },
            }

        );

        return response.json();
    }

    async expireTransaction(orderId: string) {

        const response = await fetch(

            `${env.MIDTRANS_BASE_URL}/v2/${orderId}/expire`,

            {
                method: "POST",

                headers: {
                    Authorization:
                        "Basic " +
                        Buffer.from(
                            env.MIDTRANS_SERVER_KEY + ":"
                        ).toString("base64"),
                },
            }

        );

        return response.json();
    }


    verifySignature(payload: any): boolean {

        const signature =
            crypto
                .createHash("sha512")
                .update(
                    payload.order_id +
                    payload.status_code +
                    payload.gross_amount +
                    env.MIDTRANS_SERVER_KEY
                )
                .digest("hex");

        return signature === payload.signature_key;
    }

}

export const midtransProvider = new MidtransProvider();