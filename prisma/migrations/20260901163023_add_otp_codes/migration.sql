-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('LOGIN_2FA', 'WITHDRAWAL', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_codes_userId_purpose_expiresAt_idx" ON "otp_codes"("userId", "purpose", "expiresAt");

-- CreateIndex
CREATE INDEX "otp_codes_userId_usedAt_idx" ON "otp_codes"("userId", "usedAt");

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
