export interface TransferSuccessPayload {
    receiver: string;

    amount: string;

    fee: string;

    referenceNumber: string;

    currency: string;

    transactionTime: Date;
}

export enum NotificationType {
    TRANSFER_SUCCESS = "TRANSFER_SUCCESS",
    TRANSFER_FAILED = "TRANSFER_FAILED",

    TOPUP_SUCCESS = "TOPUP_SUCCESS",
    TOPUP_FAILED = "TOPUP_FAILED",

    WITHDRAW_SUCCESS = "WITHDRAW_SUCCESS",
    WITHDRAW_FAILED = "WITHDRAW_FAILED",
}


export interface NotificationJob {

    type: NotificationType;

    userId: string;

    email?: string;

    title: string;

    message: string;

    metadata?: Record<string, any>;

}