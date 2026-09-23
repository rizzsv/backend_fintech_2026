import request from "supertest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import app from "../../../src/app";
import { dashboardService } from "../../../src/modules/dashboard/services/dashboard.service";
import { authRepository } from "../../../src/modules/auth/repositories/auth.repository";
import {
    bearerToken,
    buildTestSession,
    createExpiredAccessToken,
} from "../../helpers/auth";

vi.mock(
    "../../../src/modules/dashboard/services/dashboard.service",
    () => ({
        dashboardService: {
            getDashboard: vi.fn(),
        },
    })
);

/**
 * Only the session lookup is stubbed. The request still carries a genuinely
 * signed token through `authMiddleware`, so token verification stays covered.
 */
vi.mock(
    "../../../src/modules/auth/repositories/auth.repository",
    () => ({
        authRepository: {
            findSessionById: vi.fn(),
        },
    })
);

beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(authRepository.findSessionById).mockResolvedValue(
        buildTestSession() as any
    );
});

describe("Dashboard Endpoint", () => {
    it("GET /dashboard should return 200 with complete dashboard data", async () => {
        const mockDashboardData = {
            user: {
                id: "user-123",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
            },
            wallet: {
                balance: "1670000.00",
                currency: "IDR",
                isFrozen: false,
                walletStatus: "ACTIVE",
            },
            accountOverview: {
                isActive: true,
                isEmailVerified: false,
                kyc: {
                    status: "PENDING",
                    tier: "BASIC",
                },
                actions: {
                    canTopUp: true,
                    canTransfer: false,
                    canWithdraw: false,
                },
            },
            monthlyStatistics: {
                period: {
                    type: "MONTH",
                    startDate: "2026-09-01T00:00:00.000Z",
                    endDate: "2026-10-01T00:00:00.000Z",
                },
                totalTopUp: "2500000.00",
                totalTransfer: "1200000.00",
                totalWithdrawal: "500000.00",
            },
            cashFlow: {
                period: "7D",
                income: "2500000.00",
                expense: "1200000.00",
                net: "1300000.00",
                currency: "IDR",
                series: [
                    {
                        date: "2026-09-15",
                        income: "500000.00",
                        expense: "100000.00",
                        net: "400000.00",
                    },
                ],
            },
            limits: {
                dailyTransfer: {
                    limit: "10000000.00",
                    used: "0.00",
                    remaining: "10000000.00",
                    percentageUsed: 0,
                },
                monthlyTransfer: {
                    limit: "50000000.00",
                    used: "0.00",
                    remaining: "50000000.00",
                    percentageUsed: 0,
                },
            },
            recentTransactions: [],
            pendingActivities: [],
        };

        vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockDashboardData);

        const response = await request(app)
            .get("/api/v1/dashboard")
            .set("Authorization", bearerToken());

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Dashboard fetched successfully");
        expect(response.body.data).toBeDefined();

        // Verify response structure
        const data = response.body.data;
        expect(data.user).toBeDefined();
        expect(data.wallet).toBeDefined();
        expect(data.accountOverview).toBeDefined();
        expect(data.monthlyStatistics).toBeDefined();
        expect(data.cashFlow).toBeDefined();
        expect(data.limits).toBeDefined();
        expect(data.recentTransactions).toBeDefined();
        expect(data.pendingActivities).toBeDefined();

        // Verify monetary values are strings
        expect(typeof data.wallet.balance).toBe("string");
        expect(typeof data.monthlyStatistics.totalTopUp).toBe("string");
        expect(typeof data.limits.dailyTransfer.limit).toBe("string");

        // Verify no sensitive fields exposed
        expect(data.user.passwordHash).toBeUndefined();
        expect(data.user.emailVerificationToken).toBeUndefined();
    });

    it("GET /dashboard should return 401 without auth", async () => {
        const response = await request(app).get("/api/v1/dashboard");

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    it("GET /dashboard should return 401 for a malformed token", async () => {
        const response = await request(app)
            .get("/api/v1/dashboard")
            .set("Authorization", "Bearer not-a-real-jwt");

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe("INVALID_TOKEN");
        expect(dashboardService.getDashboard).not.toHaveBeenCalled();
    });

    it("GET /dashboard should return 401 for an expired token", async () => {
        const response = await request(app)
            .get("/api/v1/dashboard")
            .set("Authorization", bearerToken(createExpiredAccessToken()));

        expect(response.status).toBe(401);
        expect(response.body.code).toBe("TOKEN_EXPIRED");
        expect(dashboardService.getDashboard).not.toHaveBeenCalled();
    });

    it("GET /dashboard should return 401 when the session is gone", async () => {
        vi.mocked(authRepository.findSessionById).mockResolvedValue(null);

        const response = await request(app)
            .get("/api/v1/dashboard")
            .set("Authorization", bearerToken());

        expect(response.status).toBe(401);
        expect(dashboardService.getDashboard).not.toHaveBeenCalled();
    });

    it("GET /dashboard should have correct KYC and account overview structure", async () => {
        const mockData = {
            user: {
                id: "user-123",
                firstName: "Jane",
                lastName: "Smith",
                email: "jane@example.com",
            },
            wallet: {
                balance: "5000000.00",
                currency: "IDR",
                isFrozen: true,
                walletStatus: "FROZEN",
            },
            accountOverview: {
                isActive: true,
                isEmailVerified: true,
                kyc: {
                    status: "APPROVED",
                    tier: "VERIFIED",
                },
                actions: {
                    canTopUp: true,
                    canTransfer: true,
                    canWithdraw: true,
                },
            },
            monthlyStatistics: {
                period: {
                    type: "MONTH",
                    startDate: "2026-09-01T00:00:00.000Z",
                    endDate: "2026-10-01T00:00:00.000Z",
                },
                totalTopUp: "0.00",
                totalTransfer: "0.00",
                totalWithdrawal: "0.00",
            },
            cashFlow: {
                period: "7D",
                income: "0.00",
                expense: "0.00",
                net: "0.00",
                currency: "IDR",
                series: [],
            },
            limits: {
                dailyTransfer: {
                    limit: "10000000.00",
                    used: "2000000.00",
                    remaining: "8000000.00",
                    percentageUsed: 20,
                },
                monthlyTransfer: {
                    limit: "50000000.00",
                    used: "10000000.00",
                    remaining: "40000000.00",
                    percentageUsed: 20,
                },
            },
            recentTransactions: [],
            pendingActivities: [],
        };

        vi.mocked(dashboardService.getDashboard).mockResolvedValue(mockData);

        const response = await request(app)
            .get("/api/v1/dashboard")
            .set("Authorization", bearerToken());

        expect(response.status).toBe(200);
        const data = response.body.data;

        // Verify KYC structure
        expect(data.accountOverview.kyc.status).toBe("APPROVED");
        expect(data.accountOverview.kyc.tier).toBe("VERIFIED");

        // Verify wallet status reflects frozen state
        expect(data.wallet.walletStatus).toBe("FROZEN");
        expect(data.wallet.isFrozen).toBe(true);

        // Verify action eligibility
        expect(data.accountOverview.actions.canTopUp).toBe(true);
        expect(data.accountOverview.actions.canTransfer).toBe(true);
        expect(data.accountOverview.actions.canWithdraw).toBe(true);

        // Verify percentage calculations
        expect(data.limits.dailyTransfer.percentageUsed).toBe(20);
        expect(data.limits.monthlyTransfer.percentageUsed).toBe(20);
    });
});
