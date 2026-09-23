import { z } from "zod";

/**
 * `PATCH /notifications/preferences` is a partial update, so every channel is
 * optional. Without this schema the raw body reaches Prisma, where a
 * non-boolean value fails at the database layer and surfaces as a 500.
 *
 * Unknown keys are rejected rather than silently dropped, and at least one
 * channel is required so an empty body cannot pass as a successful update.
 */
export const updateNotificationPreferenceSchema = z
    .strictObject({
        inApp: z.boolean().optional(),
        email: z.boolean().optional(),
        push: z.boolean().optional(),
    })
    .refine(
        (value) => Object.keys(value).length > 0,
        {
            message:
                "At least one notification channel must be provided",
        }
    );
