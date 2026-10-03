import { UserRole, OtpPurpose } from '@prisma/client'
import { prisma } from '../../../shared/config/database'
import { authRepository } from '../repositories/auth.repository'
import { hashPassword } from '../../../shared/utils/password.utils'
import { LoginDTO, RegisterDTO } from '../types/auth.types'
import { AppError } from '../../../shared/errors/AppError'
import { comparePassword } from '../../../shared/utils/password.utils'
import { generateAccessToken, generateRefreshToken } from '../../../shared/utils/token.utils'
import { hashToken } from '../../../shared/helper/refreshtoken.helper'
import { NotFoundError } from '../../../shared/errors/NotFoundError'
import { generateVerificationToken } from '../../../shared/helper/emailVerification.helper'
import { notificationService } from '../../notification/service/notification.service'
import { NotificationType } from '../../notification/types/notification.types'
import { NotificationChannel } from '@prisma/client'
import { userRepository } from '../repositories/user.repository'
import { otpService } from './otp.service'
import crypto from 'crypto'

export class AuthService {
    async register(dto: RegisterDTO) {
        const existingEmail =
            await authRepository.findByEmail(dto.email);

        if (existingEmail) {
            throw new AppError(
                'Email already registered',
                409,
                'EMAIL_ALREADY_EXISTS'
            );
        }

        const existingPhone =
            await authRepository.findByPhoneNumber(
                dto.phoneNumber
            );

        if (existingPhone) {
            throw new AppError(
                'Phone number already registered',
                409,
                'PHONE_NUMBER_ALREADY_EXISTS'
            );
        }

        const passwordHash =
            await hashPassword(dto.password);

        const role = dto.role ?? UserRole.USER;

        // Create unverified user
        const registration = await authRepository.createRegistration({
            email: dto.email,
            phoneNumber: dto.phoneNumber,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role,
            verificationTokenHash: null,
            verificationExpiresAt: null,
        });

        // Generate OTP for email verification
        const otp = this.generateOtp();
        const otpHash = this.hashOtp(otp);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await prisma.otpCode.create({
            data: {
                userId: registration.id,
                otpHash,
                purpose: OtpPurpose.REGISTRATION,
                expiresAt,
            },
        });

        // Send OTP via email
        await notificationService.sendOTP({
            email: registration.email,
            otp,
            method: "email",
            purpose: OtpPurpose.REGISTRATION,
        });

        return {
            id: registration.id,
            email: registration.email,
        };
    }

    private generateOtp(): string {
        const min = 100000;
        const max = 999999;
        return crypto.randomInt(min, max).toString();
    }

    private hashOtp(otp: string): string {
        return crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");
    }

    async resendVerificationEmail(
        email: string
    ) {
        const user =
            await authRepository.findByEmail(email);

        if (!user) {
            throw new NotFoundError(
                "User not found"
            );
        }

        if (user.isEmailVerified) {
            throw new AppError(
                "Email already verified",
                400,
                "EMAIL_ALREADY_VERIFIED"
            );
        }

        const verificationToken =
            generateVerificationToken();

        const verificationHash =
            hashToken(verificationToken);

        const expiresAt =
            new Date(Date.now() + 60 * 60 * 1000);

        await authRepository.updateVerificationToken(
            user.id,
            verificationHash,
            expiresAt
        );

        const verificationUrl = this.buildVerificationUrl(verificationToken);

        await notificationService.sendVerificationEmail(
            user.email,
            verificationUrl
        );

        return {
            message:
                "Verification email sent"
        };
    }

    async login(dto: LoginDTO) {
        const user = await authRepository.findByEmail(dto.email);

        if (!user) {
            throw new AppError(
                "Invalid credentials",
                401,
                "INVALID_CREDENTIALS"
            );
        }

        const passwordMatch = await comparePassword(
            dto.password,
            user.passwordHash
        );

        if (!passwordMatch) {
            throw new AppError(
                "Invalid credentials",
                401,
                "INVALID_CREDENTIALS"
            );
        }

        if (!user.isEmailVerified) {
            throw new AppError(
                "Email verification is required before login",
                403,
                "EMAIL_NOT_VERIFIED"
            );
        }

        // Create session directly without OTP
        const refreshToken = generateRefreshToken();
        const refreshTokenHash = hashToken(refreshToken);

        const session = await authRepository.createSession({
            userId: user.id,
            refreshTokenHash,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        });

        const accessToken = generateAccessToken(user.id, session.id);

        // Send new login notification
        notificationService.createNotification({
            userId: user.id,
            type: NotificationType.NEW_LOGIN,
            channel: NotificationChannel.IN_APP,
            title: "Login baru terdeteksi",
            message: "Akun Anda baru saja digunakan untuk login. Jika ini bukan Anda, segera ubah password.",
            resource: "SESSION",
            entityId: session.id,
        }).catch(() => {
            // Fire and forget - don't block login for notification failure
        });

        return { accessToken, refreshToken };
    }

    async refreshToken(
        refreshToken: string
    ) {
        const refreshHash = hashToken(refreshToken);

        const session = await authRepository.findSessionByHash(refreshHash);

        if (!session) {
            throw new AppError(
                "Invalid refresh token",
                401,
                "INVALID_REFRESH_TOKEN"
            );
        }

        if (session.expiresAt < new Date()) {
            throw new AppError(
                "Refresh token expired",
                401,
                "REFRESH_TOKEN_EXPIRED"
            );
        }

        const newRefreshToken = generateRefreshToken();

        const newRefreshHash = hashToken(newRefreshToken);

        await authRepository.updateSession(
            session.id,
            newRefreshHash,
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        );

        const accessToken =
            generateAccessToken(session.userId, session.id);

        return { accessToken, refreshToken: newRefreshToken };
    }

    async logout(
        refreshToken: string
    ) {
        const refreshTokenHash = hashToken(refreshToken);

        const session = await authRepository.findSessionByHash(
            refreshTokenHash
        );

        if (!session) {
            return;
        }

        await authRepository.deactivateSession(session.id);
    }

    async logoutAllDevice(
        userId: string
    ) {
        await authRepository.deactiveAllUserSessions(
            userId
        )
    }

    async me(
        userId: string
    ) {
        const user =
            await authRepository.findById(userId);

        if (!user) {
            throw new NotFoundError('User not found')
        };

        const {
            passwordHash,
            emailVerificationToken,
            emailVerificationExpiresAt,
            kycDocumentPath,
            kycSelfiePath,
            deletedAt,
            kycStatus,
            kycTier,
            isActive,
            isEmailVerified,
            isDemo,
            ...safeUser
        } = user;

        return {
            ...safeUser,
            isDemo,
            account: {
                isActive,
                isEmailVerified,
            },
            kyc: {
                status: user.kycStatus,
                tier: user.kycTier,
            },
        };
    }

    async verifyEmailOtp(email: string, otp: string) {
        const user = await authRepository.findByEmail(email);

        if (!user) {
            throw new AppError(
                "User not found",
                404,
                "USER_NOT_FOUND"
            );
        }

        if (user.isEmailVerified) {
            throw new AppError(
                "Email already verified",
                400,
                "EMAIL_ALREADY_VERIFIED"
            );
        }

        if (!/^\d{6}$/.test(otp)) {
            throw new AppError(
                "OTP must be exactly 6 digits",
                400,
                "INVALID_OTP_FORMAT"
            );
        }

        const otpRecord = await prisma.otpCode.findFirst({
            where: {
                userId: user.id,
                purpose: OtpPurpose.REGISTRATION,
                usedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
                attempts: {
                    lt: 5,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (!otpRecord) {
            throw new AppError(
                "No active OTP found or OTP expired",
                400,
                "OTP_NOT_FOUND"
            );
        }

        const suppliedHash = this.hashOtp(otp);
        const isValid = crypto.timingSafeEqual(
            Buffer.from(suppliedHash, "hex"),
            Buffer.from(otpRecord.otpHash, "hex")
        );

        if (!isValid) {
            await prisma.otpCode.update({
                where: { id: otpRecord.id },
                data: {
                    attempts: {
                        increment: 1,
                    },
                },
            });

            const updatedRecord = await prisma.otpCode.findUnique({
                where: { id: otpRecord.id },
            });

            if (updatedRecord && updatedRecord.attempts >= 5) {
                throw new AppError(
                    "Maximum attempts exceeded. Please request a new OTP.",
                    400,
                    "MAX_ATTEMPTS_EXCEEDED"
                );
            }

            throw new AppError(
                "Invalid OTP. Please try again.",
                400,
                "INVALID_OTP"
            );
        }

        // Mark OTP as used
        await prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: {
                usedAt: new Date(),
            },
        });

        // Mark email as verified
        await authRepository.updateEmailVerificationStatus(user.id, true);

        // Generate tokens for automatic login
        const refreshToken = generateRefreshToken();
        const refreshTokenHash = hashToken(refreshToken);

        const session = await authRepository.createSession({
            userId: user.id,
            refreshTokenHash,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        });

        const accessToken = generateAccessToken(user.id, session.id);

        return {
            accessToken,
            refreshToken,
            userId: user.id,
            email: user.email,
            isEmailVerified: true,
        };
    }

    async resendEmailVerificationOtp(email: string) {
        const user = await authRepository.findByEmail(email);

        if (!user) {
            throw new AppError(
                "User not found",
                404,
                "USER_NOT_FOUND"
            );
        }

        if (user.isEmailVerified) {
            throw new AppError(
                "Email already verified",
                400,
                "EMAIL_ALREADY_VERIFIED"
            );
        }

        // Invalidate previous OTPs
        await prisma.otpCode.updateMany({
            where: {
                userId: user.id,
                purpose: OtpPurpose.REGISTRATION,
                usedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
            data: {
                usedAt: new Date(),
            },
        });

        // Generate new OTP
        const otp = this.generateOtp();
        const otpHash = this.hashOtp(otp);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await prisma.otpCode.create({
            data: {
                userId: user.id,
                otpHash,
                purpose: OtpPurpose.REGISTRATION,
                expiresAt,
            },
        });

        // Send OTP via email
        await notificationService.sendOTP({
            email: user.email,
            otp,
            method: "email",
            purpose: OtpPurpose.REGISTRATION,
        });

        return {
            message: "OTP sent successfully",
            expiresAt,
        };
    }

    async verifyEmail(token: string) {
        const tokenHash = hashToken(token);
        const user = await userRepository.findByEmailVerificationToken(tokenHash);

        if (!user) {
            throw new AppError(
                "Invalid or expired verification token",
                400,
                "INVALID_VERIFICATION_TOKEN"
            );
        }

        if (user.isEmailVerified) {
            throw new AppError(
                "Email already verified",
                400,
                "EMAIL_ALREADY_VERIFIED"
            );
        }

        const now = new Date();
        if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt <= now) {
            throw new AppError(
                "Verification token has expired",
                400,
                "VERIFICATION_TOKEN_EXPIRED"
            );
        }

        const consumed = await userRepository.consumeEmailVerificationToken(tokenHash, now);
        if (consumed.count !== 1) {
            throw new AppError(
                "Invalid or expired verification token",
                400,
                "INVALID_VERIFICATION_TOKEN"
            );
        }

        return {
            userId: user.id,
            email: user.email,
            isEmailVerified: true,
        };
    }

    private buildVerificationUrl(token: string) {
        const webAppUrl = process.env.FRONTEND_URL ?? process.env.APP_URL;

        if (!webAppUrl) {
            throw new AppError(
                "Email verification is not configured",
                500,
                "EMAIL_VERIFICATION_NOT_CONFIGURED"
            );
        }

        const verificationUrl = new URL("/verify-email", webAppUrl);
        verificationUrl.searchParams.set("token", token);

        return verificationUrl.toString();
    }

    async forgotPassword(email: string) {
        const user = await authRepository.findByEmail(email);

        // Generic response to avoid account enumeration
        if (!user) {
            return {
                message: "If an account exists with this email, a password reset code was sent",
            };
        }

        // Invalidate previous password reset OTPs
        await prisma.otpCode.updateMany({
            where: {
                userId: user.id,
                purpose: OtpPurpose.PASSWORD_RESET,
                usedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
            data: {
                usedAt: new Date(),
            },
        });

        // Generate new OTP
        const otp = this.generateOtp();
        const otpHash = this.hashOtp(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.otpCode.create({
            data: {
                userId: user.id,
                otpHash,
                purpose: OtpPurpose.PASSWORD_RESET,
                expiresAt,
            },
        });

        // Send OTP via email
        await notificationService.sendOTP({
            email: user.email,
            otp,
            method: "email",
            purpose: OtpPurpose.PASSWORD_RESET,
        });

        return {
            message: "If an account exists with this email, a password reset code was sent",
            expiresAt,
        };
    }

    async verifyPasswordResetOtp(email: string, otp: string) {
        const user = await authRepository.findByEmail(email);

        if (!user) {
            throw new AppError(
                "Invalid email or OTP",
                400,
                "INVALID_CREDENTIALS"
            );
        }

        if (!/^\d{6}$/.test(otp)) {
            throw new AppError(
                "OTP must be exactly 6 digits",
                400,
                "INVALID_OTP_FORMAT"
            );
        }

        const otpRecord = await prisma.otpCode.findFirst({
            where: {
                userId: user.id,
                purpose: OtpPurpose.PASSWORD_RESET,
                usedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
                attempts: {
                    lt: 5,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (!otpRecord) {
            throw new AppError(
                "No active OTP found or OTP expired",
                400,
                "OTP_NOT_FOUND"
            );
        }

        const suppliedHash = this.hashOtp(otp);
        const isValid = crypto.timingSafeEqual(
            Buffer.from(suppliedHash, "hex"),
            Buffer.from(otpRecord.otpHash, "hex")
        );

        if (!isValid) {
            await prisma.otpCode.update({
                where: { id: otpRecord.id },
                data: {
                    attempts: {
                        increment: 1,
                    },
                },
            });

            const updatedRecord = await prisma.otpCode.findUnique({
                where: { id: otpRecord.id },
            });

            if (updatedRecord && updatedRecord.attempts >= 5) {
                throw new AppError(
                    "Maximum attempts exceeded. Please request a new OTP.",
                    400,
                    "MAX_ATTEMPTS_EXCEEDED"
                );
            }

            throw new AppError(
                "Invalid OTP. Please try again.",
                400,
                "INVALID_OTP"
            );
        }

        // Mark OTP as used
        await prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: {
                usedAt: new Date(),
            },
        });

        return {
            verified: true,
            userId: user.id,
            email: user.email,
        };
    }

    async resetPassword(email: string, newPassword: string) {
        const user = await authRepository.findByEmail(email);

        if (!user) {
            throw new AppError(
                "User not found",
                404,
                "USER_NOT_FOUND"
            );
        }

        const passwordHash = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });

        // Invalidate all sessions for security
        await authRepository.deactiveAllUserSessions(user.id);

        return {
            message: "Password reset successfully",
        };
    }
}

export const authService = new AuthService();