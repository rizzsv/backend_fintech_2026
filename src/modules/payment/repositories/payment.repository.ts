import { Prisma, PaymentStatus } from "@prisma/client";

import { prisma } from "../../../shared/config/database";
import { withSpan } from "../../../shared/telemetry/span";

export type Tx = Prisma.TransactionClient;

class PaymentRepository {
    private toNullableJsonValue(
        value: Prisma.JsonValue
    ): Prisma.InputJsonValue | Prisma.NullTypes.JsonNull {
        return value === null ? Prisma.JsonNull : value;
    }

    async create(
        data: Prisma.PaymentCreateInput,
        tx: Tx) {
        const db = tx ?? prisma;

        return db.payment.create({
            data,
        });
    }

    async findById(id: string, tx?: Tx) {
        const db = tx ?? prisma;
        return db.payment.findUnique({
            where: {
                id,
            },
            include: {
                user: true
            }
        });
    }

    async findByReference(referenceNumber: string, tx?: Tx) {
        const db = tx ?? prisma;
        return withSpan(
            "payment.findByReference",
            async () => {
                return db.payment.findUnique({
                    where: {
                        referenceNumber,
                    },
                    include: {
                        user: true
                    }
                })
            }
        )
    }

    async findByExternalReference(externalReference: string, tx: Tx) {
        const db = tx ?? prisma;
        return db.payment.findFirst({
            where: {
                externalReference,
            },
            include: {
                user: true
            }
        });
    }

    async findPending(
        tx?: Tx,
    ) {

        const db =
            tx ?? prisma;

        return db.payment.findMany({

            where: {

                status: PaymentStatus.PENDING,

                expiredAt: {
                    gt: new Date(),
                },

            },

            orderBy: {
                createdAt: "asc",
            }

        });
    }

    async updateStatus(
        referenceNumber: string,
        status: PaymentStatus,
        providerResponse: Prisma.InputJsonValue,
        tx?: Tx
    ) {
        const db = tx ?? prisma;

        return db.payment.update({
            where: {
                referenceNumber,
            },
            data: {
                status,
                providerResponse
            },
        });
    }

    async updateProviderResponse(
        referenceNumber: string,
        providerResponse: Prisma.JsonValue
    ) {
        return prisma.payment.update({
            where: {
                referenceNumber,
            },
            data: {
                providerResponse: this.toNullableJsonValue(providerResponse),
            },
        });
    }

    async updatePaid(
        referenceNumber: string,
        externalReference: string,
        providerResponse: Prisma.JsonValue
    ) {
        return prisma.payment.update({
            where: {
                referenceNumber,
            },
            data: {
                status: PaymentStatus.SUCCESS,
                paidAt: new Date(),
                externalReference,
                providerResponse: this.toNullableJsonValue(providerResponse),
            },
        });
    }

    async updateExpired(referenceNumber: string) {
        return prisma.payment.update({
            where: {
                referenceNumber,
            },
            data: {
                status: PaymentStatus.EXPIRED,
            },
        });
    }



    async updateCancelled(referenceNumber: string) {
        return prisma.payment.update({
            where: {
                referenceNumber,
            },
            data: {
                status: PaymentStatus.FAILED,
            },
        });
    }

    async updateFailed(
        referenceNumber: string,
        providerResponse: Prisma.JsonValue
    ) {
        return prisma.payment.update({
            where: {
                referenceNumber,
            },
            data: {
                status: PaymentStatus.FAILED,
                providerResponse: this.toNullableJsonValue(providerResponse),
            },
        });
    }

    async getPendingPayments() {
        return prisma.payment.findMany({
            where: {
                status: PaymentStatus.PENDING,
            },
        });
    }

    async markSuccess(
        paymentId: string,
        providerResponse: Prisma.InputJsonValue,
        tx: Tx
    ) {

        return tx.payment.updateMany({
            where: {
                id: paymentId,
                status: PaymentStatus.PENDING,
            },
            data: {
                status: PaymentStatus.SUCCESS,
                providerResponse
            },
        });
    }

    async markFailed(
        paymentId: string,
        providerResponse: Prisma.JsonValue,
        tx: Tx
    ) {
        const executor = tx ?? prisma;

        return executor.payment.update({
            where: {
                id: paymentId,
            },
            data: {
                status: PaymentStatus.FAILED,
                providerResponse: this.toNullableJsonValue(providerResponse),
            },
        });
    }

    async markExpired(
        paymentId: string,
        providerResponse: Prisma.InputJsonValue,
        tx?: Tx
    ) {
        const db = tx ?? prisma;

        return db.payment.update({
            where: {
                id: paymentId,
            },
            data: {
                status: PaymentStatus.EXPIRED,
                providerResponse
            }
        })
    }

    async markCancelled(
        paymentId: string,
        providerResponse: Prisma.InputJsonValue,
        tx?: Tx
    ) {
        const db = tx ?? prisma;

        return db.payment.update({
            where: {
                id: paymentId,
            },
            data: {
                status: PaymentStatus.FAILED,
                providerResponse
            },
        });
    }

    async findExpiredPending() {
        return prisma.payment.findMany({
            where: {
                status: PaymentStatus.PENDING,
                expiresAt: {
                    lt: new Date(),
                },
            }
        });
    }

    async countPending() {
        return prisma.payment.count({
            where: {
                status: PaymentStatus.PENDING,
            }
        })
    }
}

export const paymentRepository = new PaymentRepository();