import { UserRole } from '@prisma/client'
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

        const verificationToken = generateVerificationToken();
        const verificationHash = hashToken(verificationToken);
        const verificationUrl = `${process.env.APP_URL}/api/v1/auth/verify-email?token=${verificationToken}`;

        const registration = await prisma.$transaction(async (tx) => {
            const user =
                await authRepository.createUser(tx, {
                    email: dto.email,
                    phoneNumber: dto.phoneNumber,
                    passwordHash,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    role,
                });

            await authRepository.createWallet(
                tx,
                user.id
            );

            await authRepository.createUserLimit(
                tx,
                user.id
            );

            await authRepository.updateVerificationTokenRegister(
                tx,
                user.id,
                verificationHash,
                new Date(
                    Date.now() + 24 * 60 * 60 * 1000
                )
            );

            return {
                id: user.id,
                email: user.email,
            }
        });

        await notificationService.sendVerificationEmail(
            registration.email,
            verificationUrl
        );

        return registration;
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

        const verificationUrl =
            `${process.env.APP_URL}/api/auth/verify-email?token=${verificationToken}`;

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

        const refreshToken = generateRefreshToken();

        const refreshTokenHash = hashToken(refreshToken);

        const session = await prisma.session.create({
            data: {
                userId: user.id,
                refreshTokenHash,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            }
        });

        const accessToken = generateAccessToken(user.id, session.id);

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
            ...safeUser
        } = user;

        return {
            ...safeUser,
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
}

export const authService = new AuthService();