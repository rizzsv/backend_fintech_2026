class BlacklistService {
    async isBlackListed(
        userId: string,
    ) {
        return false;
    }
}

export const blacklistService = new BlacklistService();