import { Prisma } from "@prisma/client";
import { auditRepository } from "../repositories/audit.repositories";
import { CreateAuditLogDTO } from "../types/audit.types";
import { AuditActorType, AuditStatus } from "../constant/audit.constan";
import { withSpan } from "../../../shared/telemetry/span";

export class AuditService {
async log(
    dto: CreateAuditLogDTO,
    tx?: Prisma.TransactionClient
) {
    return withSpan(
        "audit.log",
        async () => {

            return auditRepository.create(
                {
                    action: dto.action,
                    resource: dto.resource,
                    entityId: dto.entityId,

                    actorType:
                        dto.actorType ??
                        AuditActorType.USER,

                    status:
                        dto.status ??
                        AuditStatus.SUCCESS,

                    requestId: dto.requestId,
                    metadata: dto.metadata,
                    ipAddress: dto.ipAddress,
                    userAgent: dto.userAgent,

                    ...(dto.userId && {
                        user: {
                            connect: {
                                id: dto.userId,
                            },
                        },
                    }),
                },
                tx
            );

        }
    );
}
}

export const auditService = new AuditService();