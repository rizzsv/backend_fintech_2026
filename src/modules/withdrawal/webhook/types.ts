export interface WithdrawalWebhookPayload {
    referenceNumber: string;
    providerReference: string;
    status: "SUCCESS" | "FAILED" | "PENDING";
    response?: unknown;
}