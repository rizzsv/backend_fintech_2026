import { describe, expect, it } from "vitest";

import {
    updateNotificationPreferenceSchema,
} from "../../../src/modules/notification/validators/notification.validator";

describe("updateNotificationPreferenceSchema", () => {

    it("accepts a partial update of one channel", () => {
        const result =
            updateNotificationPreferenceSchema.safeParse({
                email: false,
            });

        expect(result.success).toBe(true);
    });

    it("accepts every channel at once", () => {
        const result =
            updateNotificationPreferenceSchema.safeParse({
                inApp: true,
                email: false,
                push: true,
            });

        expect(result.success).toBe(true);
    });

    /**
     * Without the schema this value reached Prisma, where the column type
     * rejected it and the request surfaced as an opaque 500.
     */
    it("rejects a non-boolean channel value", () => {
        const result =
            updateNotificationPreferenceSchema.safeParse({
                email: "yes",
            });

        expect(result.success).toBe(false);
    });

    it("rejects an empty body so a no-op cannot report success", () => {
        const result =
            updateNotificationPreferenceSchema.safeParse({});

        expect(result.success).toBe(false);
    });

    /**
     * The repository only ever writes the three known channels, so an unknown
     * key means the caller is wrong about the contract.
     */
    it("rejects unknown keys instead of silently dropping them", () => {
        const result =
            updateNotificationPreferenceSchema.safeParse({
                email: true,
                sms: true,
            });

        expect(result.success).toBe(false);
    });
});
