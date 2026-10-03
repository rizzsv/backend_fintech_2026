import { describe, it, expect, vi, beforeEach } from 'vitest';
import { googleOAuthService } from '../../../src/modules/auth/services/google-oauth.service';
import { oauthRepository } from '../../../src/modules/auth/repositories/oauth.repository';
import { authRepository } from '../../../src/modules/auth/repositories/auth.repository';
import { redis } from '../../../src/shared/config/redis';
import { prisma } from '../../../src/shared/config/database';

vi.mock('../../../src/shared/config/redis');
vi.mock('../../../src/modules/auth/repositories/oauth.repository');
vi.mock('../../../src/modules/auth/repositories/auth.repository');
vi.mock('../../../src/shared/config/database');

describe('GoogleOAuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('generateAuthUrl', () => {
        it('should generate auth URL with secure state', async () => {
            vi.mocked(redis.setex).mockResolvedValue('OK' as any);

            const result = await googleOAuthService.generateAuthUrl();

            expect(result.url).toContain('https://accounts.google.com');
            expect(result.url).toContain('openid');
            expect(result.url).toContain('email');
            expect(result.url).toContain('profile');
            expect(result.state).toHaveLength(64); // 32 bytes hex
            expect(redis.setex).toHaveBeenCalledWith(
                expect.stringContaining('oauth:state:'),
                600,
                expect.any(String)
            );
        });
    });

    describe('state validation', () => {
        it('should reject missing state', async () => {
            await expect(
                (googleOAuthService as any).validateState('')
            ).rejects.toThrow('Missing OAuth state');
        });

        it('should reject invalid state', async () => {
            vi.mocked(redis.get).mockResolvedValue(null);

            await expect(
                (googleOAuthService as any).validateState('invalid-state')
            ).rejects.toThrow('Invalid or expired OAuth state');
        });

        it('should accept valid state and delete it', async () => {
            const state = 'valid-state';
            vi.mocked(redis.get).mockResolvedValue(JSON.stringify({ createdAt: Date.now() }));
            vi.mocked(redis.del).mockResolvedValue(1);

            await (googleOAuthService as any).validateState(state);

            expect(redis.get).toHaveBeenCalledWith(`oauth:state:${state}`);
            expect(redis.del).toHaveBeenCalledWith(`oauth:state:${state}`);
        });
    });
});
