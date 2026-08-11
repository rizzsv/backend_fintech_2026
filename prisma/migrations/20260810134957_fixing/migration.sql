/*
  Warnings:

  - A unique constraint covering the columns `[idempotency_key]` on the table `withdrawals` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "withdrawals" ADD COLUMN     "idempotency_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "withdrawals_idempotency_key_key" ON "withdrawals"("idempotency_key");
