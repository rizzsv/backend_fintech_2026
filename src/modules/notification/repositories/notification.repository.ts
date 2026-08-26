import { Prisma, Notification, NotificationStatus, NotificationChannel } from "@prisma/client";
import { CreateNotificationInput } from "../types/notification.types";
import { prisma } from "../../../shared/config/database";

export class NotificationRepository {
    async create(
        data: CreateNotificationInput,
        tx?: Prisma.TransactionClient
    ): Promise<Notification> {
        const db = tx ?? prisma;

        return db.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                channel: data.channel,
                status: data.status ?? NotificationStatus.PENDING,
                title: data.title,
                message: data.message,
                resource: data.resource,
                entityId: data.entityId,
                metadata: data.metadata ? (data.metadata as Prisma.InputJsonObject) : undefined
            }
        })
    }

    async findById(
        id: string,
        tx? : Prisma.TransactionClient
    ): Promise<Notification | null> {
        const db = tx ?? prisma;

        return db.notification.findUnique({
            where: {
                id,
            }
        })
    }

    async findByUserId(
        userId: string,
        options?: {
            limit?: number;
            offset?: number;
            unreadOnly?: boolean;
        },
        tx? : Prisma.TransactionClient
    ): Promise<Notification[]> {
        const db = tx ?? prisma;

        return db.notification.findMany({
            where: {
                userId,
                ...(options?.unreadOnly !== undefined ? {
                    isRead: options.unreadOnly ? false : undefined
                }: {}),
            },

            orderBy: {
                createdAt: 'desc'
            },
            take: options?.limit ?? 20,
            skip: options?.offset ?? 0
        })
    }

    async countUnread(
        userId: string,
        tx?: Prisma.TransactionClient
    ): Promise<number> {
        const db = tx ?? prisma;

        return db.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    }

async markAsRead(
    id: string,
    userId: string,
    tx?: Prisma.TransactionClient
): Promise<Notification> {

    const db = tx ?? prisma;

    const notification = await db.notification.findFirst({
        where: {
            id,
            userId,
        },
    });

    if (!notification) {
        throw new Error("Notification not found");
    }

    return db.notification.update({
        where: {
            id: notification.id,
        },

        data: {
            isRead: true,

            status: NotificationStatus.READ,

            readAt: new Date(),
        },
    });
}


    async markAllAsRead(
        userId: string,
        tx?: Prisma.TransactionClient
    ): Promise<Prisma.BatchPayload> {
        const db = tx ?? prisma;

        return db.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },

            data: {
                isRead: true,
                status: NotificationStatus.READ,
                readAt: new Date(),
            },
        });
    }

    async updateStatus(
        id: string,
        status: NotificationStatus,
        data?: {
            failedReason?: string;
            retryCount?: number;
        },
        tx?: Prisma.TransactionClient
    ): Promise<Notification> {
        const db = tx ?? prisma;

        return db.notification.update({
            where: {
                id,
            },
            data: {
                status,
                ...(status === NotificationStatus.SENT ? {
                    sentAt: new Date(),
                } : {}),
                ...(status === NotificationStatus.FAILED ? {
                    failedAt: new Date(),
                    failedReason: data?.failedReason,
                } : {}),
                ...(data?.retryCount !== undefined ? {
                    retryCount: data.retryCount,
                }: {})
            }
        })
    }

    async markProcessing(
        id: string,
        tx?: Prisma.TransactionClient 
    ): Promise<Notification> {
        const db = tx ?? prisma;

        return db.notification.update({
            where: {
                id,
            },
            data: {
                status: NotificationStatus.PROCESSING,
            },
        });
    }

    async incrementRetry(
        id: string,
        tx?: Prisma.TransactionClient
    ): Promise<Notification> {
        const db = tx ?? prisma;

        return db.notification.update({
            where: {
                id,
            },
            data: {
                retryCount: {
                    increment: 1
                },
            },
        });
    }

    async findPending(
        channel?: NotificationChannel,
        limit = 100,
        tx?: Prisma.TransactionClient
    ): Promise<Notification[]> {
        const db = tx ?? prisma;

        return db.notification.findMany({
            where: {
                resource: channel ? channel : undefined,

                entityId: undefined,
            },
            orderBy: {
                createdAt: 'asc'
            },
            take: limit,
        })
    }
}

export const notificationRepository = new NotificationRepository();