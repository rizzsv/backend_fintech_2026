export const PAYMENT_PROVIDER = {
    MIDTRANS: "MIDTRANS",
} as const;

export const PAYMENT_METHOD = {
    QRIS: "qris",
    BANK_TRANSFER: "bank_transfer",
    GOPAY: "gopay",
    SHOPEPAY: "shopeepay",
} as const;

export const PAYMENT_EXPIRATION_MINUTES = 15;
export const PAYMENT_DESCRIPTION_PREFIX = "Wallet Top Up - ";