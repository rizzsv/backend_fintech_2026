-- AlterEnum
-- Rename EMAIL_VERIFICATION to REGISTRATION and add LOGIN purpose
BEGIN;

-- Create new enum with updated values
CREATE TYPE "OtpPurpose_new" AS ENUM ('REGISTRATION', 'LOGIN', 'LOGIN_2FA', 'WITHDRAWAL', 'PASSWORD_RESET');

-- Update existing records: EMAIL_VERIFICATION -> REGISTRATION
ALTER TABLE "otp_codes" 
  ALTER COLUMN "purpose" TYPE "OtpPurpose_new" 
  USING (
    CASE 
      WHEN "purpose"::text = 'EMAIL_VERIFICATION' THEN 'REGISTRATION'::text
      ELSE "purpose"::text
    END
  )::"OtpPurpose_new";

-- Drop old enum and rename new one
DROP TYPE "OtpPurpose";
ALTER TYPE "OtpPurpose_new" RENAME TO "OtpPurpose";

COMMIT;
