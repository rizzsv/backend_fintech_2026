import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { KycStorage } from "./kyc.storage";




export class LocalKycStorage implements KycStorage {

    private readonly basePath =
        path.resolve(
            process.env.KYC_STORAGE_PATH ??
            "./private/kyc"
        );


    private async ensureDirectory(
        directory: string
    ): Promise<void> {

        await fs.mkdir(
            directory,
            {
                recursive: true,
            }
        );
    }


    private generateFileName(
        originalName: string
    ): string {

        const extension =
            path.extname(originalName)
                .toLowerCase();

        const randomName =
            crypto.randomUUID();

        return `${randomName}${extension}`;
    }


    async uploadDocument(
        file: Express.Multer.File,
        userId: string
    ): Promise<string> {

        const directory =
            path.join(
                this.basePath,
                userId,
                "documents"
            );


        await this.ensureDirectory(
            directory
        );


        const fileName =
            this.generateFileName(
                file.originalname
            );


        const filePath =
            path.join(
                directory,
                fileName
            );


        await fs.writeFile(
            filePath,
            file.buffer
        );


        return path.relative(
            this.basePath,
            filePath
        );
    }


    async uploadSelfie(
        file: Express.Multer.File,
        userId: string
    ): Promise<string> {

        const directory =
            path.join(
                this.basePath,
                userId,
                "selfies"
            );


        await this.ensureDirectory(
            directory
        );


        const fileName =
            this.generateFileName(
                file.originalname
            );


        const filePath =
            path.join(
                directory,
                fileName
            );


        await fs.writeFile(
            filePath,
            file.buffer
        );


        return path.relative(
            this.basePath,
            filePath
        );
    }


    async delete(
        storagePath: string
    ): Promise<void> {

        const filePath =
            path.join(
                this.basePath,
                storagePath
            );


        await fs.rm(
            filePath,
            {
                force: true,
            }
        );
    }
}


export const kycStorage =
    new LocalKycStorage();