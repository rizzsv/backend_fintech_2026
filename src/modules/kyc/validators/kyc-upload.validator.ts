import path from "node:path";
import { KYC_UPLOAD_CONFIG } from "../types/kyc-upload.types";
import {
    detectFileType,
    SupportedFileType,
} from "./file-signature.validator";

export function isFileSignatureCompatible(
    detectedType: SupportedFileType,
    mimeType: string,
    extension: string
): boolean {
    if (detectedType === "jpeg") {
        return (
            mimeType === "image/jpeg" &&
            (
                extension === ".jpg" ||
                extension === ".jpeg"
            )
        );
    }

    if (detectedType === "png") {
        return (
            mimeType === "image/png" &&
            extension === ".png"
        );
    }

    if (detectedType === "pdf") {
        return (
            mimeType === "application/pdf" &&
            extension === ".pdf"
        );
    }

    return false;
}

export class KycUploadValidator {
    validateDocument(
        file?: Express.Multer.File
    ): void {
        if (!file) {
            throw new Error(
                "KYC document is required"
            )
        }

        this.validateFile(
            file,
            KYC_UPLOAD_CONFIG.document
        )
    }

    validateSelfie(
        file?: Express.Multer.File
    ): void {
        if (!file) {
            throw new Error(
                "selfie is required"
            )
        }

        this.validateFile(
            file,
            KYC_UPLOAD_CONFIG.selfie
        )
    }

    private validateFile(
        file: Express.Multer.File,
        config: {
            maxSize: number;
            allowedMimeTypes: readonly string[];
            allowedExtensions: readonly string[];
        }
    ): void {
        if (
            file.size > config.maxSize
        ) {
            throw new Error(
                "File exceeds maximum allowed size"
            )
        }

        if (
            !config.allowedMimeTypes.includes(
                file.mimetype
            )
        ) {
            throw new Error(
                "Unsupported file type"
            )
        }

        const extension = path.extname(
            file.originalname
        ).toLowerCase();

        if (
            !config.allowedExtensions.includes(
                extension
            )
        ) {
            throw new Error(
                "Unsupported file extension"
            )
        }

        const filename = path.basename(
            file.originalname,
        );

        if (
            filename !== file.originalname
        ) {
            throw new Error(
                "Invalid file name"
            )
        }

        const detectedType = detectFileType(
            file.buffer
        );

        if (!detectedType) {
            throw new Error(
                "Unable to verify file type"
            )
        }

        const compatible =
            isFileSignatureCompatible(
                detectedType,
                file.mimetype,
                extension
            );

        if (!compatible) {
            throw new Error(
                "File content does not match its declared type"
            );
        }
    }
}

export const KyxUploadValidator = KycUploadValidator;

export const kycUploadValidator = new KycUploadValidator();