-- AlterTable: Add account_number field to wallets table
-- Step 1: Add nullable column
ALTER TABLE "wallets" ADD COLUMN "account_number" VARCHAR(10);

-- Step 2: Backfill existing wallets with unique account numbers
-- Generate random 10-digit numbers for existing rows
-- Uses MD5 hash of wallet ID to generate deterministic but non-sequential numbers
DO $$
DECLARE
    wallet_record RECORD;
    new_account_number VARCHAR(10);
    collision_count INT;
BEGIN
    FOR wallet_record IN SELECT id FROM wallets WHERE account_number IS NULL LOOP
        collision_count := 0;
        LOOP
            -- Generate 10-digit number from random + timestamp
            new_account_number := LPAD(
                (FLOOR(RANDOM() * 9000000000) + 1000000000)::BIGINT::TEXT,
                10,
                '0'
            );
            
            -- Check for collision
            IF NOT EXISTS (SELECT 1 FROM wallets WHERE account_number = new_account_number) THEN
                UPDATE wallets 
                SET account_number = new_account_number 
                WHERE id = wallet_record.id;
                EXIT;
            END IF;
            
            collision_count := collision_count + 1;
            IF collision_count > 100 THEN
                RAISE EXCEPTION 'Failed to generate unique account number after 100 attempts for wallet %', wallet_record.id;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Step 3: Set NOT NULL constraint
ALTER TABLE "wallets" ALTER COLUMN "account_number" SET NOT NULL;

-- Step 4: Add UNIQUE constraint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_account_number_key" UNIQUE ("account_number");

-- Step 5: Create index for account number lookups
CREATE INDEX "idx_wallets_account_number" ON "wallets"("account_number");
