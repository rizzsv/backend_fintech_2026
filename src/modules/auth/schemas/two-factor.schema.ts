import {z} from "zod";

export const enable2FASchema = z.object({
    method: z.enum([
        "email",
        "sms"
    ]),
});

export const verify2FASchema = z.object({
    otp: z
    .string()
    .regex(/^\d{6}$/, "OTP must be a 6-digit number"),
})