import { KycStatus, NotificationChannel } from "@prisma/client";
import { KycRepository } from "../repositories/kyc.repository";
import { KycReviewDecision, ManualKycReviewInput, ManualKycReviewResponse } from "../types/kyc-review.types";
import { PrismaKycRepository } from "../repositories/prisma-kyc.repository";
import { notificationService } from "../../notification/service/notification.service";
import { NotificationType } from "../../notification/types/notification.types";


export class KycReviewService {
    constructor(
        private readonly kycRepository: KycRepository
    ) {}

    async review(
        input: ManualKycReviewInput
    ): Promise<ManualKycReviewResponse> {
        const {kycId, reviewerId, decision, reviewNote} = input;

        if(!reviewerId) {
            throw new Error("Reviewer ID is required");
        }

        if (
            decision == KycReviewDecision.REJECT && !reviewNote?.trim()
        ) {
            throw new Error(
                "Review note is required when rejecting a KYC request"
            );
        }

        const kyc = await this.kycRepository.findById(kycId);

        if (!kyc) {
            throw new Error(`KYC with ID ${kycId} not found`);
        }

        if(
            kyc.status !== KycStatus.PENDING
        ) {
            throw new Error(
                "Only pending KYC requests can be reviewed"
            )
        }

        const status = decision === KycReviewDecision.APPROVE ? KycStatus.VERIFIED : KycStatus.REJECTED;

        const reviewedAt = new Date();

        const updated = await this.kycRepository.review(
                    kycId,
                    {
                        status,
                        reviewNote: reviewNote?.trim(),
                        reviewedAt
                    }
                );

                // Send KYC status notification
                const notificationType = decision === KycReviewDecision.APPROVE 
                    ? NotificationType.KYC_APPROVED 
                    : NotificationType.KYC_REJECTED;
        
                const title = decision === KycReviewDecision.APPROVE
                    ? "Verifikasi KYC disetujui"
                    : "Verifikasi KYC ditolak";
        
                const message = decision === KycReviewDecision.APPROVE
                    ? "Selamat! Verifikasi KYC Anda telah disetujui. Anda sekarang dapat mengakses semua fitur."
                    : `Verifikasi KYC Anda ditolak. ${reviewNote?.trim() || "Silakan ajukan ulang dengan dokumen yang valid."}`;

                notificationService.createNotification({
                    userId: updated.userId,
                    type: notificationType,
                    channel: NotificationChannel.IN_APP,
                    title,
                    message,
                    resource: "KYC",
                    entityId: updated.id,
                    metadata: {
                        status: updated.status,
                        reviewNote: updated.reviewNote,
                    },
                }).catch(() => {
                    // Fire and forget
                });

                return {
            id: updated.id,
            userId: updated.userId,
            status: updated.status,
            reviewNote: updated.reviewNote,
            reviewedAt: updated.reviewedAt
        }
    }
}

export const kycReviewService =
    new KycReviewService(
        new PrismaKycRepository()
    );