/*
  Warnings:

  - Added the required column `channel` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'READ');

-- DropIndex
DROP INDEX "idx_notifications_user_read";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "channel" "NotificationChannel" NOT NULL,
ADD COLUMN     "entity_id" TEXT,
ADD COLUMN     "failed_at" TIMESTAMP(3),
ADD COLUMN     "failed_reason" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "read_at" TIMESTAMP(3),
ADD COLUMN     "resource" TEXT,
ADD COLUMN     "retry_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sent_at" TIMESTAMP(3),
ADD COLUMN     "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "idx_notifications_user_status" ON "notifications"("user_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "idx_notifications_user_read" ON "notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "idx_notifications_resource_entity" ON "notifications"("resource", "entity_id");

-- CreateIndex
CREATE INDEX "idx_notifications_channel_status" ON "notifications"("channel", "status");
