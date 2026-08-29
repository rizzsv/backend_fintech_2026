import multer from "multer";

const storage = multer.memoryStorage();

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
];

export const kycUpload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 2,
        fields: 0,
        parts: 2,
    },
    fileFilter: (_req, file, cb) => {
        if (!allowedMimeTypes.includes(file.mimetype)) {
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
            return;
        }

        cb(null, true);
    },
});