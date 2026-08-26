/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "email" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "in_app" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "push" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "uq_notification_preferences_user" ON "notifications"("user_id");
