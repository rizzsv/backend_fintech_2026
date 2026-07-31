-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "actor_type" TEXT NOT NULL DEFAULT 'USER',
ADD COLUMN     "entity_id" TEXT,
ADD COLUMN     "request_id" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'SUCCESS';

-- CreateIndex
CREATE INDEX "idx_audit_request" ON "audit_logs"("request_id");

-- CreateIndex
CREATE INDEX "idx_audit_created" ON "audit_logs"("created_at");
