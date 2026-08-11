export const DAILY_TRANSFER_LIMIT = {
    BASIC: 2_000_000, // 2 million
    PREMIUM: 20_000_000, // 20 million
} as const;

export const FRAUD = {
    MAX_SINGGLE_TRANSFER: 10_000_000, // 10 million
    MAX_TRANSFER_PER_MINUTE: 5,
}