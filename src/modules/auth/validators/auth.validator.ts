import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email(),
    phoneNumber: z.string().min(10).max(15),
    password: z.string().min(8),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.nativeEnum(UserRole).optional().default(UserRole.USER),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export const resendVerificationSchema = z.object({
  email: z
    .string()
    .email("Invalid email"),
});

export const logoutAllDeviceSchema = z.object({})