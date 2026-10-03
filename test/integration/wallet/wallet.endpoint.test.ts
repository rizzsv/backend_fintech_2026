import request from "supertest";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { NotFoundError } from "../../../src/shared/errors/NotFoundError";

const walletServiceMock = {
  getWallet: vi.fn(),
  getBalance: vi.fn(),
  getLimits: vi.fn(),
  getLedger: vi.fn(),
};

vi.mock(
  "../../../src/shared/middleware/auth.middleware",
  () => ({
    authMiddleware: (
      req: any,
      _res: any,
      next: any
    ) => {
      req.user = {
        id: "user-1",
        sessionId: "session-1",
      };

      next();
    },
  })
);

vi.mock(
  "../../../src/modules/wallet/services/wallet.service",
  () => ({
    WalletService: vi.fn(function (this: any) {
      // Mock constructor returns mock instance
      return walletServiceMock;
    }),
  })
);

// Import app after mocks are set up
const { default: app } = await import("../../helpers/app");

describe("Wallet Endpoint", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /wallet should return wallet", async () => {
    walletServiceMock.getWallet.mockResolvedValue({
      id: "wallet-1",
      currency: "IDR",
    });

    const response = await request(app)
      .get("/api/v1/wallet");

    expect(response.status).toBe(200);
    expect(response.body.data.currency).toBe("IDR");
  });

  it("GET /wallet/balance should return balance", async () => {
    walletServiceMock.getBalance.mockResolvedValue({
      walletId: "wallet-1",
      balance: 100000,
      currency: "IDR",
      source: "redis",
    });

    const response = await request(app)
      .get("/api/v1/wallet/balance");

    expect(response.status).toBe(200);
    expect(response.body.data.balance).toBe(100000);
  });

  it("GET /wallet/limits should return limits", async () => {
    walletServiceMock.getLimits.mockResolvedValue({
      dailyLimit: 10000000,
      monthlyLimit: 50000000,
    });

    const response = await request(app)
      .get("/api/v1/wallet/limits");

    expect(response.status).toBe(200);
    expect(response.body.data.dailyLimit).toBe(10000000);
  });

  it("GET /wallet/ledger should return ledger", async () => {
    walletServiceMock.getLedger.mockResolvedValue({
      items: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });

    const response = await request(app)
      .get("/api/v1/wallet/ledger");

    expect(response.status).toBe(200);
    expect(response.body.data.items).toEqual([]);
  });

  it("GET /wallet should return 404 when wallet not found", async () => {
    walletServiceMock.getWallet.mockRejectedValue(
      new NotFoundError("Wallet not found")
    );

    const response = await request(app)
      .get("/api/v1/wallet");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Wallet not found");
  });
});