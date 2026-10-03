import { z } from "zod";

export interface WithdrawalWebhookPayload {
    referenceNumber: string;
    providerReference: string;
    status: "SUCCESS" | "FAILED" | "PENDING";
    response?: unknown;
}

export const withdrawalWebhookSchema = z.object({
    referenceNumber: z.string().min(1),
    providerReference: z.string().min(1),
    status: z.enum(["SUCCESS", "FAILED", "PENDING"]),
    response: z.unknown().optional(),
});