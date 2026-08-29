import { KYC_UPLOAD_CONFIG } from "../types/kyc-upload.types";

export class KycValidator {
    validateDocument(
        file: Express.Multer.File
    ): void {
        if (!file) {
            throw new Error("Document file is required.");
        }

        if (
            file.size > KYC_UPLOAD_CONFIG.document.maxSize 
        ) {
            throw new Error(`Document file size exceeds the maximum limit of ${KYC_UPLOAD_CONFIG.document.maxSize / (1024 * 1024)}MB.`);
        }

        if (
            !KYC_UPLOAD_CONFIG.document.allowedMimeTypes.includes(file.mimetype as never)
        ) {
            throw new Error(`Invalid document file type. Allowed types are: ${KYC_UPLOAD_CONFIG.document.allowedMimeTypes.join(", ")}.`);
        }
    }

    validateSelfie(
        file?: Express.Multer.File
    ): void {
        if (!file) {
            return;
        }

        if (
            file.size > KYC_UPLOAD_CONFIG.selfie.maxSize
        ) {
            throw new Error(`Selfie file size exceeds the maximum limit of ${KYC_UPLOAD_CONFIG.selfie.maxSize / (1024 * 1024)}MB.`);
        }

        if (
            !KYC_UPLOAD_CONFIG.selfie.allowedMimeTypes.includes(file.mimetype as never)
        ) {
            throw new Error(`Invalid selfie file type. Allowed types are: ${KYC_UPLOAD_CONFIG.selfie.allowedMimeTypes.join(", ")}.`);
        }
    }
}

export const kycValidator = new KycValidator();