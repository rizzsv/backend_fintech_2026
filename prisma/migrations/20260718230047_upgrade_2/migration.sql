-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "paymentType" TEXT;
