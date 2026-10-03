import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "crypto";
import { withdrawalWebhookValidator } from "../../../src/modules/withdrawal/webhook/wdWebhook.validator";
import { env } from "../../../src/shared/config/env";

describe("Withdrawal Webhook Security", () => {
    const validPayload = {
        referenceNumber: "WD-TEST-123",
        providerReference: "PROV-123",
        status: "SUCCESS" as const,
    };

    const generateValidSignature = (payload: any): string => {
        return crypto
            .createHmac("sha256", env.WITHDRAWAL_WEBHOOK_SECRET)
            .update(JSON.stringify(payload))
            .digest("hex");
    };

    describe("Signature Verification", () => {
        it("should accept valid signature", () => {
            const signature = generateValidSignature(validPayload);

            expect(() => {
                withdrawalWebhookValidator.verify(validPayload, signature);
            }).not.toThrow();
        });

        it("should reject forged signature", () => {
            const forgedSignature = "forged_signature_12345";

            expect(() => {
                withdrawalWebhookValidator.verify(validPayload, forgedSignature);
            }).toThrow("Invalid webhook signature");
        });

        it("should reject tampered payload with valid signature", () => {
            const signature = generateValidSignature(validPayload);

            const tamperedPayload = {
                ...validPayload,
                status: "FAILED" as const, // Attacker changes status
            };

            expect(() => {
                withdrawalWebhookValidator.verify(tamperedPayload, signature);
            }).toThrow("Invalid webhook signature");
        });

        it("should reject empty signature", () => {
            expect(() => {
                withdrawalWebhookValidator.verify(validPayload, "");
            }).toThrow("Invalid webhook signature");
        });

        it("should reject payload tampering (amount manipulation)", () => {
            const payloadWithAmount = {
                ...validPayload,
                amount: 100000,
            };

            const signature = generateValidSignature(payloadWithAmount);

            const tamperedPayload = {
                ...payloadWithAmount,
                amount: 999999999, // Attacker tries to change amount
            };

            expect(() => {
                withdrawalWebhookValidator.verify(tamperedPayload, signature);
            }).toThrow("Invalid webhook signature");
        });

        it("should reject different secret key", () => {
            const wrongSecret = "wrong_secret_key";
            const wrongSignature = crypto
                .createHmac("sha256", wrongSecret)
                .update(JSON.stringify(validPayload))
                .digest("hex");

            expect(() => {
                withdrawalWebhookValidator.verify(validPayload, wrongSignature);
            }).toThrow("Invalid webhook signature");
        });
    });
});
