export interface KycStorage {
    uploadDocument(
        file: Express.Multer.File,
        userId: string        
    ): Promise<string>;

    uploadSelfie(
        file: Express.Multer.File,
        userId: string
    ): Promise<string>;

    delete(
        path: string
    ): Promise<void>;
}