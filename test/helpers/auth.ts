import jwt from "jsonwebtoken";

import { generateAccessToken } from "../../src/shared/utils/token.utils";

/**
 * Shared identifiers for authenticated integration tests. Using the same pair
 * everywhere keeps the signed token, the mocked session row and any
 * `req.user` assertions in agreement.
 */
export const TEST_USER_ID = "user-123";
export const TEST_SESSION_ID = "session-123";

/**
 * Signs a real access token with the production signer so requests travel the
 * actual `authMiddleware` path (verify -> session lookup) instead of bypassing
 * it. `test/setup.ts` pins `JWT_SECRET` before any module is imported, so the
 * signature produced here is the one the middleware expects.
 */
export function createTestAccessToken(
    userId: string = TEST_USER_ID,
    sessionId: string = TEST_SESSION_ID
) {
    return generateAccessToken(userId, sessionId);
}

/**
 * An already-expired token, for asserting the TOKEN_EXPIRED branch. The
 * production signer hardcodes a 15m lifetime, so the expiry has to be set here.
 */
export function createExpiredAccessToken(
    userId: string = TEST_USER_ID,
    sessionId: string = TEST_SESSION_ID
) {
    return jwt.sign(
        { sub: userId, sessionId },
        process.env.JWT_SECRET!,
        { expiresIn: "-1s" }
    );
}

/**
 * Ready-made `Authorization` header value for supertest's `.set()`.
 */
export function bearerToken(
    token: string = createTestAccessToken()
) {
    return `Bearer ${token}`;
}

/**
 * A Session row shaped like the one `authRepository.findSessionById` returns.
 * That repository already filters on `isActive: true`, so a resolved value is
 * always an active session.
 */
export function buildTestSession(
    overrides: Record<string, unknown> = {}
) {
    return {
        id: TEST_SESSION_ID,
        userId: TEST_USER_ID,
        refreshTokenHash: "hashed-refresh-token",
        deviceName: null,
        deviceIp: null,
        userAgent: null,
        isActive: true,
        is2FAVerified: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        lastActivity: null,
        ...overrides,
    };
}
