import { Prisma, NotificationPreference } from "@prisma/client";
import { prisma } from "../../../shared/config/database";

export class NotificationPreferenceRepository {
async findByUserId(
        userId: string,
        tx?: Prisma.TransactionClient
    ): Promise<NotificationPreference | null> {

        const db = tx ?? prisma;

        return db.notificationPreference.findUnique({
            where: {
                userId,
            },
        });
    }

async createDefault(
    userId: string,
    tx?: Prisma.TransactionClient
): Promise<NotificationPreference | null> {
    const db = tx ?? prisma;

    return db.notificationPreference.create({
        data: {
            userId,
            inApp: true,
            email: true,
            push: true,
        },
    });
 }

 async upsert(
    userId: string,
    data: {
        inApp?: boolean;
        email?: boolean;
        push?: boolean;
    },
    tx?: Prisma.TransactionClient
 ): Promise<NotificationPreference> {
    const db = tx ?? prisma;

    return db.notificationPreference.upsert({
        where: {
            userId,
        },
        create: {
            userId,

            inApp: data.inApp ?? true,
            email: data.email ?? true,
            push: data.push ?? true,
        },
        update: {
            ...(data.inApp !== undefined && { inApp: data.inApp }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.push !== undefined && { push: data.push }),
        }
    });
  }
}

export const notificationPreferenceRepository = new NotificationPreferenceRepository();