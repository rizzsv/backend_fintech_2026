export interface PaymentDLQJob {
    notification: any;
    error: string;
    attempts: number;
    failedAt: Date;
}