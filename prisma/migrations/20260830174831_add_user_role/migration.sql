-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('USER', 'ADMIN', 'SUPPORT');

-- AlterEnum
ALTER TYPE "kyc_status" ADD VALUE 'APPROVED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "user_role" NOT NULL DEFAULT 'USER';
