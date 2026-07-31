import {Prisma} from "@prisma/client";

export interface CreateAuditLogDTO {
    userId?: string;
    actorType?: string;
    action: string;
    resource: string;
    entityId?: string;
    status?: string;
    requestId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
}