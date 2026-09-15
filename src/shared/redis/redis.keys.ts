export const RedisKeys = {
    otp: (email: string) => `otp:${email}`,
    otpAttempts: (email: string) => `otp-attempts:${email}`,
    otpLock: (email: string) => `otp-lock:${email}`,
}