export const AuditActorType = {
    USER: "USER",
    ADMIN: "ADMIN",
    SYSTEM: "SYSTEM",
    WORKER: "WORKER",
    WEBHOOK: "WEBHOOK"
} as const;

export const AuditStatus = {
    SUCCESS: "SUCCESS",
    FAILED: "FAILED",
} as const;

export const AuditResource = {
    USER: "USER",
    WALLET: "WALLET",
    PAYMENT: "PAYMENT",
    TRANSACTION: "TRANSACTION",
    KYC: "KYC",
    AUTH: "AUTH",
} as const;

export const AuditAction = {
    LOGIN: "LOGIN",
    LOGOUT: "LOGOUT",
    PAYMENT_CREATED: "PAYMENT_CREATED",
    PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
    PAYMENT_FAILED: "PAYMENT_FAILED",
    PAYMENT_EXPIRED: "PAYMENT_EXPIRED",
    WALLET_CREDIT: "WALLET_CREDIT",
    WALLET_DEBIT: "WALLET_DEBIT",
    TRANSFER: "TRANSFER",
    KYC_APPROVED: "KYC_APPROVED",
    KYC_REJECTED: "KYC_REJECTED",
} as const;