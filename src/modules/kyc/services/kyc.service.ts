import {
    KycRequest,
    KycStatus,
} from "@prisma/client";

import {
    KycRepository,
} from "../repositories/kyc.repository";



import {
    KycUploadValidator,
} from "../validators/kyc-upload.validator";

import {
    UploadKycDocumentsInput,
    KycDocumentResponse,
} from "../types/kyc.types";
import { KycStorage } from "../storage/kyc.storage";
import { PrismaKycRepository } from "../repositories/prisma-kyc.repository";
import { kycStorage } from "../storage/local-kyc.storage";


export class KycService {

    constructor(
        private readonly kycRepository: KycRepository,

        private readonly kycStorage: KycStorage,

        private readonly kycUploadValidator:
            KycUploadValidator
    ) {}


    async uploadDocuments(
        input: UploadKycDocumentsInput
    ): Promise<KycDocumentResponse> {

        const {
            userId,
            document,
            documents,
            selfie,
        } = input;

        const documentFile =
            document ?? documents;

        if (!documentFile) {
            throw new Error(
                "KYC document is required"
            );
        }

        /**
         * 1. Validate document
         */
        this.kycUploadValidator
            .validateDocument(
                documentFile
            );


        /**
         * 2. Validate selfie
         */
        this.kycUploadValidator
            .validateSelfie(
                selfie
            );


        /**
         * 3. Check existing KYC request
         */
        const existing =
            await this.kycRepository
                .findByUserId(userId);


        if (existing) {
            if (
                existing.status ===
                KycStatus.PENDING
            ) {
                throw new Error(
                    "KYC request is already pending"
                );
            }

            if (
                existing.status ===
                KycStatus.VERIFIED
            ) {
                throw new Error(
                    "KYC has already been verified"
                );
            }
        }


        let documentPath: string | null = null;

        let selfiePath: string | null = null;


        try {

            /**
             * 4. Upload document
             */
            documentPath =
                await this.kycStorage
                    .uploadDocument(
                        documentFile,
                        userId
                    );


            /**
             * 5. Upload selfie
             */
            selfiePath =
                await this.kycStorage
                    .uploadSelfie(
                        selfie,
                        userId
                    );


            /**
             * 6. Create KYC record
             */
            const kyc =
                await this.kycRepository
                    .create({
                        user: {
                            connect: {
                                id: userId,
                            },
                        },

                        documentPath,

                        selfiePath,

                        status:
                            KycStatus.PENDING,
                    });


            /**
             * 7. Response
             */
            return this.toResponse(
                kyc
            );

        } catch (error) {

            /**
             * Cleanup uploaded files
             *
             * If document was uploaded but
             * selfie/database operation failed,
             * remove the already uploaded file.
             */

            if (documentPath) {

                try {

                    await this.kycStorage
                        .delete(
                            documentPath
                        );

                } catch {
                    // Do not hide original error
                }
            }


            if (selfiePath) {

                try {

                    await this.kycStorage
                        .delete(
                            selfiePath
                        );

                } catch {
                    // Do not hide original error
                }
            }


            throw error;
        }
    }


    private toResponse(
        kyc: KycRequest
    ): KycDocumentResponse {

        return {
            id: kyc.id,

            userId: kyc.userId,

            documentPath:
                kyc.documentPath,

            selfiePath:
                kyc.selfiePath,

            status:
                kyc.status,

            reviewNote:
                kyc.reviewNote,

            reviewedAt:
                kyc.reviewedAt,

            createdAt:
                kyc.createdAt,

            updatedAt:
                kyc.updatedAt,
        };
    }
}

export const kycService = 
new KycService(
    new PrismaKycRepository(),
    kycStorage,
    new KycUploadValidator
)