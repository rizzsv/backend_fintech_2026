export interface GoogleOAuthConfig {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
}

export interface GoogleTokenPayload {
    sub: string; // Google's stable user ID
    email: string;
    email_verified: boolean;
    iss?: string; // Issuer
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
}

export interface OAuthState {
    state: string;
    expiresAt: number;
}

export interface OAuthCallbackResult {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
    };
}
