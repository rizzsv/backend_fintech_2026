export const KYC_UPLOAD_CONFIG = {
    document: {
        maxSize: 5 * 1024 * 1024,

        allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "application/pdf",
        ],

        allowedExtensions: [
            ".jpg",
            ".jpeg",
            ".png",
            ".pdf",
        ],
    },

    selfie: {
        maxSize: 5 * 1024 * 1024,

        allowedMimeTypes: [
            "image/jpeg",
            "image/png",
        ],

        allowedExtensions: [
            ".jpg",
            ".jpeg",
            ".png",
        ],
    },
} as const;