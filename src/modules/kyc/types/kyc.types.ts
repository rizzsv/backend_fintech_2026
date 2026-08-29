import {KycStatus} from "@prisma/client";
import "multer";

export interface UploadKycDocumentsInput {
    userId: string;
    document?: Express.Multer.File;
    documents?: Express.Multer.File;
    selfie: Express.Multer.File;
}

export interface KycDocumentResponse {
    id: string;
    userId: string;
    documentPath: string | null;
    selfiePath: string | null;

    status : KycStatus

    reviewNote: string | null;
    reviewedAt: Date | null;

    createdAt: Date;
    updatedAt: Date;
}