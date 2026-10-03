import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { oauthRepository } from '../repositories/oauth.repository';
import { authRepository } from '../repositories/auth.repository';
import { AppError } from '../../../shared/errors/AppError';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { generateAccessToken, generateRefreshToken } from '../../../shared/utils/token.utils';
import { hashToken } from '../../../shared/helper/refreshtoken.helper';
import { redis } from '../../../shared/config/redis';
import { GoogleOAuthConfig, GoogleTokenPayload, OAuthCallbackResult } from '../types/oauth.types';
import { prisma } from '../../../shared/config/database';
import { UserRole } from '@prisma/client';

export class GoogleOAuthService {
    private oauth2Client: OAuth2Client;
    private config: GoogleOAuthConfig;
    private readonly STATE_PREFIX = 'oauth:state:';
    private readonly STATE_EXPIRY = 600; // 10 minutes

    constructor() {
        this.config = {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackUrl: process.env.GOOGLE_CALLBACK_URL!,
        };

        if (!this.config.clientId || !this.config.clientSecret || !this.config.callbackUrl) {
            throw new Error('Google OAuth configuration missing');
        }

        this.oauth2Client = new OAuth2Client(
            this.config.clientId,
            this.config.clientSecret,
            this.config.callbackUrl
        );
    }

    /**
     * Generate authorization URL with secure state
     */
    async generateAuthUrl(): Promise<{ url: string; state: string }> {
        const state = crypto.randomBytes(32).toString('hex');

        // Store state in Redis with expiry
        await redis.setex(
            `${this.STATE_PREFIX}${state}`,
            this.STATE_EXPIRY,
            JSON.stringify({
                createdAt: Date.now(),
            })
        );

        const url = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['openid', 'email', 'profile'],
            state,
        });

        return { url, state };
    }

    /**
     * Validate OAuth state (CSRF protection)
     */
    private async validateState(state: string): Promise<void> {
        if (!state) {
            throw new AppError('Missing OAuth state', 400, 'INVALID_STATE');
        }

        const key = `${this.STATE_PREFIX}${state}`;
        const stored = await redis.get(key);

        if (!stored) {
            throw new AppError('Invalid or expired OAuth state', 400, 'INVALID_STATE');
        }

        // Delete state after validation (one-time use)
        await redis.del(key);
    }

    /**
     * Handle OAuth callback
     */
    async handleCallback(code: string, state: string, deviceInfo: {
        ip?: string;
        userAgent?: string;
        deviceName?: string;
    }): Promise<OAuthCallbackResult> {
        // Validate state first (CSRF protection)
        await this.validateState(state);

        // Exchange authorization code for tokens
        const { tokens } = await this.oauth2Client.getToken(code);
        
        if (!tokens.id_token) {
            throw new AppError('No ID token received from Google', 500, 'OAUTH_ERROR');
        }

        // Verify and decode ID token
        const ticket = await this.oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: this.config.clientId,
        });

        const payload = ticket.getPayload() as GoogleTokenPayload;

        if (!payload || !payload.sub || !payload.email) {
            throw new AppError('Invalid Google identity', 400, 'INVALID_IDENTITY');
        }

        // Verify issuer
        if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
            throw new AppError('Invalid token issuer', 400, 'INVALID_ISSUER');
        }

        // Find or create user
        const user = await this.findOrCreateUser(payload);

        // Create session
        const refreshToken = generateRefreshToken();
        const refreshTokenHash = hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        const session = await prisma.session.create({
            data: {
                userId: user.id,
                refreshTokenHash,
                expiresAt,
                deviceIp: deviceInfo.ip,
                userAgent: deviceInfo.userAgent,
                deviceName: deviceInfo.deviceName,
                isActive: true,
                is2FAVerified: false, // OAuth doesn't verify 2FA
            },
        });

        const accessToken = generateAccessToken(user.id, session.id);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName ?? undefined,
                lastName: user.lastName ?? undefined,
            },
        };
    }

    /**
     * Find existing user by Google identity or create new user
     */
    private async findOrCreateUser(payload: GoogleTokenPayload) {
        // CASE A: Existing Google identity
        const existing = await oauthRepository.findByProviderAccount('google', payload.sub);
        if (existing) {
            return existing.user;
        }

        // CASE B: Existing user with matching verified email (safe account linking)
        if (payload.email_verified) {
            const userByEmail = await authRepository.findByEmail(payload.email);
            if (userByEmail && userByEmail.isEmailVerified) {
                // Link Google account to existing user
                await oauthRepository.create({
                    userId: userByEmail.id,
                    provider: 'google',
                    providerAccountId: payload.sub,
                    email: payload.email,
                });
                return userByEmail;
            }
        }

        // CASE C: New user - create account
        return this.createUserFromGoogle(payload);
    }

    /**
     * Create new user from Google identity
     */
    private async createUserFromGoogle(payload: GoogleTokenPayload) {
        // Generate placeholder phone number (Google doesn't provide it)
        const phoneNumber = `+62${Date.now().toString().slice(-10)}`;

        // Generate secure random password (user won't know it, OAuth-only account)
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const passwordHash = crypto.createHash('sha256').update(randomPassword).digest('hex');

        return prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    email: payload.email,
                    phoneNumber,
                    passwordHash,
                    firstName: payload.given_name || null,
                    lastName: payload.family_name || null,
                    role: UserRole.USER,
                    isEmailVerified: payload.email_verified, // Trust Google's verification
                    isDemo: false,
                },
            });

            // Create wallet
            const { generateAccountNumber } = await import('../../../shared/utils/account-number.utils.js');
            const accountNumber = generateAccountNumber();
            await tx.wallet.create({
                data: {
                    userId: user.id,
                    currency: 'IDR',
                    accountNumber,
                },
            });

            // Create user limit
            await tx.userLimit.create({
                data: {
                    userId: user.id,
                    dailyLimit: 10000000, // 10M IDR default
                    monthlyLimit: 100000000, // 100M IDR default
                },
            });

            // Create OAuth account link
            await tx.oAuthAccount.create({
                data: {
                    userId: user.id,
                    provider: 'google',
                    providerAccountId: payload.sub,
                    email: payload.email,
                },
            });

            // Create notification preferences
            await tx.notificationPreference.create({
                data: {
                    userId: user.id,
                    inApp: true,
                    email: true,
                    push: false,
                },
            });

            return user;
        });
    }
}

export const googleOAuthService = new GoogleOAuthService();
