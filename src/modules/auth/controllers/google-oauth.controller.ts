import { Request, Response, NextFunction } from 'express';
import { googleOAuthService } from '../services/google-oauth.service';
import { ResponseUtils } from '../../../shared/utils/response.utils';
import { AppError } from '../../../shared/errors/AppError';

export class GoogleOAuthController {
    /**
     * Initiate Google OAuth flow
     * GET /api/v1/auth/google
     */
    async initiateOAuth(req: Request, res: Response, next: NextFunction) {
        try {
            const { url, state } = await googleOAuthService.generateAuthUrl();

            // Redirect to Google
            res.redirect(url);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Handle Google OAuth callback
     * GET /api/v1/auth/google/callback
     */
    async handleCallback(req: Request, res: Response, next: NextFunction) {
        try {
            const { code, state, error: oauthError } = req.query;

            // Handle user denial
            if (oauthError) {
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
                return res.redirect(`${frontendUrl}/?error=oauth_denied`);
            }

            if (!code || typeof code !== 'string') {
                throw new AppError('Missing authorization code', 400, 'MISSING_CODE');
            }

            if (!state || typeof state !== 'string') {
                throw new AppError('Missing OAuth state', 400, 'MISSING_STATE');
            }

            // Device info for session
            const deviceInfo = {
                ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip,
                userAgent: req.headers['user-agent'],
                deviceName: 'Web Browser',
            };

            const result = await googleOAuthService.handleCallback(code, state, deviceInfo);

            // Redirect to frontend with tokens (secure - same-origin)
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
            const redirectUrl = `${frontendUrl}/auth/callback?` +
                `accessToken=${encodeURIComponent(result.accessToken)}&` +
                `refreshToken=${encodeURIComponent(result.refreshToken)}`;

            res.redirect(redirectUrl);
        } catch (error) {
            // Redirect to frontend with error
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
            const errorMessage = error instanceof Error ? error.message : 'OAuth failed';
            res.redirect(`${frontendUrl}/?error=${encodeURIComponent(errorMessage)}`);
        }
    }
}

export const googleOAuthController = new GoogleOAuthController();
