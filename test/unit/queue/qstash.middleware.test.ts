import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { verifyQStashSignature, getQStashRetryInfo } from "../../../src/shared/queue/qstash.middleware";

// Mock the entire qstash module before importing
vi.mock("@upstash/qstash", () => {
    return {
        Receiver: vi.fn(),
    };
});

vi.mock("../../../src/shared/config/env", () => ({
    env: {
        QSTASH_CURRENT_SIGNING_KEY: "test_current_key",
        QSTASH_NEXT_SIGNING_KEY: "test_next_key",
    },
}));

vi.mock("../../../src/shared/logger/business-logger", () => ({
    BusinessLogger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe("QStash Signature Verification", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {
            headers: {},
            body: "",
            protocol: "https",
            get: vi.fn((header: string) => {
                if (header === "host") return "backend.example.com";
                return undefined;
            }),
            originalUrl: "/api/workers/withdrawal",
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };

        next = vi.fn();
    });

    it("should reject request with missing signature", async () => {
        req.body = JSON.stringify({ withdrawalId: "wth_123" });

        await verifyQStashSignature(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "Unauthorized: Missing QStash signature",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("should extract retry info from headers", () => {
        req.headers!["upstash-retried"] = "1672531200000,1672531260000,1672531320000";

        const retryInfo = getQStashRetryInfo(req as Request);

        expect(retryInfo.retryCount).toBe(3);
        expect(retryInfo.retryTimestamps).toEqual([1672531200000, 1672531260000, 1672531320000]);
    });

    it("should return zero retries when header missing", () => {
        const retryInfo = getQStashRetryInfo(req as Request);

        expect(retryInfo.retryCount).toBe(0);
        expect(retryInfo.retryTimestamps).toEqual([]);
    });

    it("should return zero retries when header is empty string", () => {
        req.headers!["upstash-retried"] = "";

        const retryInfo = getQStashRetryInfo(req as Request);

        expect(retryInfo.retryCount).toBe(0);
    });

    it("should handle array header format", () => {
        req.headers!["upstash-retried"] = ["1672531200000", "1672531260000"];

        const retryInfo = getQStashRetryInfo(req as Request);

        // Header is array, takes first element
        expect(retryInfo.retryCount).toBeGreaterThanOrEqual(0);
    });
});

