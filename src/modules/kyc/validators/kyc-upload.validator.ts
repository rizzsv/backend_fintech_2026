import path from "node:path";
import { KYC_UPLOAD_CONFIG } from "../types/kyc-upload.types";
import { AppError } from "../../../shared/errors/AppError";
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

/**
 * Every rejection below is a caller mistake, so it has to reach the client as a
 * 400. A plain Error is not an AppError and the error handler turns it into an
 * opaque 500, which hides the reason the upload was refused.
 */
function invalidUpload(message: string): AppError {
    return new AppError(
        message,
        400,
        "VALIDATION_ERROR"
    );
}

export class KycUploadValidator {
    validateDocument(
        file?: Express.Multer.File
    ): void {
        if (!file) {
            throw invalidUpload(
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
            throw invalidUpload(
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
            throw invalidUpload(
                "File exceeds maximum allowed size"
            )
        }

        if (
            !config.allowedMimeTypes.includes(
                file.mimetype
            )
        ) {
            throw invalidUpload(
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
            throw invalidUpload(
                "Unsupported file extension"
            )
        }

        const filename = path.basename(
            file.originalname,
        );

        if (
            filename !== file.originalname
        ) {
            throw invalidUpload(
                "Invalid file name"
            )
        }

        const detectedType = detectFileType(
            file.buffer
        );

        if (!detectedType) {
            throw invalidUpload(
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
            throw invalidUpload(
                "File content does not match its declared type"
            );
        }
    }
}