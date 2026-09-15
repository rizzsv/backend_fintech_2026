ALTER TABLE "sessions"
ADD COLUMN "is_2fa_verified" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "users"
ADD COLUMN "has_2fa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "two_factor_method" TEXT;