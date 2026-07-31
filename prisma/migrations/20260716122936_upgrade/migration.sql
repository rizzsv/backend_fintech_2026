/*
  Warnings:

  - You are about to drop the column `callbackToken` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `fee` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paidAt` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `qrImageUrl` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `qrString` on the `Payment` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Payment_externalReference_idx";

-- DropIndex
DROP INDEX "Payment_externalReference_key";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "callbackToken",
DROP COLUMN "fee",
DROP COLUMN "paidAt",
DROP COLUMN "qrImageUrl",
DROP COLUMN "qrString",
ADD COLUMN     "paymentUrl" TEXT,
ADD COLUMN     "qrUrl" TEXT,
ALTER COLUMN "status" DROP DEFAULT;
