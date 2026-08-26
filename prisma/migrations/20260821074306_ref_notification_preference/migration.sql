/*
  Warnings:

  - You are about to drop the column `email` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `in_app` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `push` on the `notifications` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "uq_notification_preferences_user";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "email",
DROP COLUMN "in_app",
DROP COLUMN "push";

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "in_app" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "push" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_notification_preferences_user" ON "notification_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
