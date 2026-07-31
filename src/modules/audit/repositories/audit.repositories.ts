import {Prisma} from "@prisma/client";
import { prisma } from "../../../shared/config/database";

type TX = Prisma.TransactionClient;

class AuditRepository {
    async create(
        data: Prisma.AuditLogCreateInput,
        tx?: TX
    ) {
        if (tx) {
            const db = tx ?? prisma;

            return db.auditLog.create({ data });
        }
    }
}

export const auditRepository = new AuditRepository();