-- AlterEnum
ALTER TYPE "OtpPurpose" ADD VALUE 'EMAIL_VERIFICATION';

-- DropIndex
DROP INDEX "idx_users_is_demo";
