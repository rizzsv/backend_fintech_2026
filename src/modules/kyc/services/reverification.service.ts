import { KycStatus, Prisma } from "@prisma/client";
import { KycRepository } from "../repositories/kyc.repository";
import { ReverificationTriggerInput, ReverificationTriggerResult } from "../types/reverification.types";
import { PrismaKycRepository } from "../repositories/prisma-kyc.repository";
import { auditService } from "../../audit/services/audit.services";

export class ReverificationService {
    constructor(
        private readonly kycRepository: KycRepository,
        private readonly auditService?: {
            log(input: {
                userId: string;
                action: string;
                resource: string;
                entityId?: string;
                metadata?: Prisma.InputJsonValue;
            }): Promise<unknown>;
        }
    ){}

    async trigger(
        input: ReverificationTriggerInput
    ): Promise<ReverificationTriggerResult> {
        const { kycId, userId, trigger, reason, metadata } = input;

        if (!kycId) {
            throw new Error("KYC ID is required for reverification trigger.");
        }

        if (!userId) {
            throw new Error("User ID is required for reverification trigger.");
        }

        if (!trigger) {
            throw new Error("Trigger type is required for reverification trigger.");
        }

        const kyc = await this.kycRepository.findById(kycId);

        if (!kyc) {
            throw new Error("KYC request not found");
        }
        
        if (
            kyc.userId !== userId
        ) {
            throw new Error("KYC does not belong to user");
        }

        const previousStatus = kyc.status;

        if (
            kyc.status ===
            KycStatus.PENDING
        ) {
            return {
                triggerId: `${kycId}-${Date.now()}`,
                triggered: false,
                kycId,
                userId,
                previousStatus,
                currentStatus: kyc.status,
                trigger,
                reason: "KYC is already pending",
                triggeredAt: new Date().toISOString(),
            };
        }

        if (
            kyc.status !==
            KycStatus.APPROVED
        ) {
            throw new Error(
                "Only approved KYC can be re-verified"
            );
        }

        const triggeredAt = new Date();
        const reviewNote = reason?.trim()
            ? `Reverification triggered due to ${trigger}. Reason: ${reason}`
            : `Reverification triggered due to ${trigger}.`;

        const updated = await this.kycRepository.resetForReverification(
            kycId,
            reviewNote,
            triggeredAt
        );

        if (this.auditService) {
            await this.auditService.log({
                userId,
                action: "REVERIFICATION_TRIGGERED",
                resource: "KYC_REQUEST",
                entityId: kycId,
                metadata: {
                    trigger,
                    reason: reason ?? null,
                    previousStatus,
                    currentStatus: updated.status,
                    ...metadata,
                },
            });
        }

        return {
            triggerId: `${kycId}-${Date.now()}`,
            triggered: true,
            kycId,
            userId,
            previousStatus,
            currentStatus: updated.status,
            trigger,
            reason,
            triggeredAt: triggeredAt.toISOString(),
        };

    }
}

export const reverificationService =
    new ReverificationService(
        new PrismaKycRepository(),

        auditService
    );