import { prisma } from "../../../shared/config/database";

export class SessionRepository {
    async mark2FAVerified(sessionId: string) {
        return prisma.session.update({
            where: { id: sessionId },
            data: { is2FAVerified: true },
        });
    }

    async findById(sessionId: string) {
        return prisma.session.findUnique({
            where: { id: sessionId }
        })
    }
}

export const sessionRepository = new SessionRepository();