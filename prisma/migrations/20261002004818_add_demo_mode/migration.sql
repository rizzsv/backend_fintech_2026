-- Add isDemo field to users table
ALTER TABLE "users" ADD COLUMN "is_demo" BOOLEAN NOT NULL DEFAULT false;

-- Create index for demo users for efficient filtering
CREATE INDEX "idx_users_is_demo" ON "users"("is_demo");
