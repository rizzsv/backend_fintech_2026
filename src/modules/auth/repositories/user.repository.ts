import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../../shared/config/database";

export class UserRepository {
    async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
        });
    }

    async findRoleById(userId: string): Promise<UserRole | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        return user?.role ?? null;
    }

    async updateRole(
        userId: string,
        role: UserRole,
        tx?: Prisma.TransactionClient
    ) {
        const client = tx ?? prisma;

        return client.user.update({
            where: { id: userId },
            data: { role },
        });
    }
}

export const userRepository = new UserRepository();
