import midtransClient from "midtrans-client";
import {env} from "../../../shared/config/env";

// Legacy client exports - kept for backward compatibility but not used
// Use midtransProvider instead which has lazy initialization
export const snapClient = env.MIDTRANS_SERVER_KEY ? new midtransClient.Snap({
    isProduction: env.MIDTRANS_IS_PRODUCTION,
    serverKey: env.MIDTRANS_SERVER_KEY,
    clientKey: env.MIDTRANS_CLIENT_KEY!,
}) : null;

export const coreClient = env.MIDTRANS_SERVER_KEY ? new midtransClient.CoreApi({
    isProduction: env.MIDTRANS_IS_PRODUCTION,
    serverKey: env.MIDTRANS_SERVER_KEY,
    clientKey: env.MIDTRANS_CLIENT_KEY!,
}) : null;