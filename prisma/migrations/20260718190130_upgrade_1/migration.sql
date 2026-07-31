/*
  Warnings:

  - You are about to drop the column `external_reference` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `payment_channel` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Made the column `from_wallet_id` on table `transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `to_wallet_id` on table `transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('CREDIT', 'DEBIT');

-- DropIndex
DROP INDEX "idx_tx_from_wallet";

-- DropIndex
DROP INDEX "idx_tx_status";

-- DropIndex
DROP INDEX "idx_tx_to_wallet";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "external_reference",
DROP COLUMN "metadata",
DROP COLUMN "payment_channel",
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "from_wallet_id" SET NOT NULL,
ALTER COLUMN "to_wallet_id" SET NOT NULL,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "description" SET DATA TYPE TEXT,
ALTER COLUMN "reference_number" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "transactions_from_wallet_id_idx" ON "transactions"("from_wallet_id");

-- CreateIndex
CREATE INDEX "transactions_to_wallet_id_idx" ON "transactions"("to_wallet_id");
