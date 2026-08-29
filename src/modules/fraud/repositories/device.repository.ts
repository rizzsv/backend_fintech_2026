import { Prisma } from "@prisma/client";
import { prisma } from "../../../shared/config/database";

export class DeviceRepository {
    async findUserDevice(
        userId: string,
        deviceId: string,
        tx?: Prisma.TransactionClient
    ) {
        const db = tx ?? prisma;

        return db.userDevice.findUnique({
            where: {
                userId_deviceId: {
                    userId,
                    deviceId,
                }
            }
        });
    }

    async countUserDevices(
        userId: string,
        tx?: Prisma.TransactionClient
    ): Promise<number> {
        const db = tx ?? prisma;

        return db.userDevice.count({
            where: {
                userId,
            }
        })
    } 

    async countDeviceTransacions24h(
        userId: string,
        deviceId: string,
        tx?: Prisma.TransactionClient
    ): Promise<number> {
        const db = tx ?? prisma;

        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

        return db.transaction.count({
            where: {
                fromWallet: {
                    userId,
                },

                createdAt: {
                    gte: since,
                },

                metaData: {
                    path: [
                        "deviceId",
                    ],
                    equals: deviceId,
                }
            }
        })
    }
}


export const deviceRepository = new DeviceRepository();