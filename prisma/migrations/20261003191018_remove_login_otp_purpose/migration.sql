-- RemoveEnum
-- Remove LOGIN from OtpPurpose enum (no longer used after removing login OTP requirement)
BEGIN;

-- Create new enum without LOGIN
CREATE TYPE "OtpPurpose_new" AS ENUM ('REGISTRATION', 'LOGIN_2FA', 'WITHDRAWAL', 'PASSWORD_RESET');

-- Update any existing LOGIN records to LOGIN_2FA using the OLD enum type
-- Column is still OtpPurpose at this point, so cast to OtpPurpose not OtpPurpose_new
UPDATE "otp_codes" 
  SET "purpose" = 'LOGIN_2FA'::"OtpPurpose"
  WHERE "purpose" = 'LOGIN'::"OtpPurpose";

-- Alter column to use new enum
ALTER TABLE "otp_codes" 
  ALTER COLUMN "purpose" TYPE "OtpPurpose_new" 
  USING ("purpose"::text::"OtpPurpose_new");

-- Drop old enum and rename new one
DROP TYPE "OtpPurpose";
ALTER TYPE "OtpPurpose_new" RENAME TO "OtpPurpose";

COMMIT;
