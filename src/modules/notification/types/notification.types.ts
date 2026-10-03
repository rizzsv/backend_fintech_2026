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

    // Transaction
    TRANSFER_SUCCESS = "TRANSFER_SUCCESS",
    TRANSFER_RECEIVED = "TRANSFER_RECEIVED",
    TRANSFER_FAILED = "TRANSFER_FAILED",

    // Payment
    PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
    PAYMENT_FAILED = "PAYMENT_FAILED",
    PAYMENT_PENDING = "PAYMENT_PENDING",

    // Topup
    TOPUP_SUCCESS = "TOPUP_SUCCESS",
    TOPUP_FAILED = "TOPUP_FAILED",
    TOPUP_PENDING = "TOPUP_PENDING",

    // Withdrawal
    WITHDRAW_SUCCESS = "WITHDRAW_SUCCESS",
    WITHDRAW_FAILED = "WITHDRAW_FAILED",
    WITHDRAW_PENDING = "WITHDRAW_PENDING",

    // Security
    NEW_LOGIN = "NEW_LOGIN",
    PASSWORD_CHANGED = "PASSWORD_CHANGED",
    EMAIL_VERIFICATION_REMINDER = "EMAIL_VERIFICATION_REMINDER",

    // KYC
    KYC_SUBMITTED = "KYC_SUBMITTED",
    KYC_UNDER_REVIEW = "KYC_UNDER_REVIEW",
    KYC_APPROVED = "KYC_APPROVED",
    KYC_REJECTED = "KYC_REJECTED",
    KYC_NEEDS_INFO = "KYC_NEEDS_INFO",
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