import { NotificationChannel, NotificationStatus } from "@prisma/client";

export interface TransferSuccessPayload {
    receiver: string;

    amount: string;

    fee: string;

    referenceNumber: string;

    currency: string;

    transactionTime: Date;
}

export enum NotificationType {
    OTP = "OTP",

    TRANSFER_SUCCESS = "TRANSFER_SUCCESS",
    TRANSFER_RECEIVED = "TRANSFER_RECEIVED",
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

export interface CreateNotificationInput {

    userId: string;

    type: NotificationType;

    channel: NotificationChannel;

    title: string;

    status?: NotificationStatus;

    message: string;

    resource?: string;

    entityId?: string;

    metadata?: Record<string, unknown>;
}


export interface NotificationResponse {

    id: string;

    userId: string;

    type: string;

    channel: NotificationChannel;

    status: NotificationStatus;

    title: string;

    message: string;

    resource: string | null;

    entityId: string | null;

    isRead: boolean;

    readAt: Date | null;

    sentAt: Date | null;

    createdAt: Date;

}