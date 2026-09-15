export interface DashboardResponse {
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        emailVerified: boolean;
    };

    wallet: {
        balance: number;
        currency: string;
    };

    limits: {
        dailyTransfer: {
            limit: number;
            used: number;
            remaining: number;
        };

        monthlyTransfer: {
            limit: number;
            used: number;
            remaining: number;
        };
    };

    kyc: {
        status: string;
        tier: string;
    };

    security: {
        emailVerified: boolean;
        twoFactorEnabled: boolean;
    };

    recentTransactions: unknown[];
}