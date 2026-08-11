-- CreateTable
CREATE TABLE "withdrawals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "fee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(18,2) NOT NULL,
    "method" "WithdrawalMethod" NOT NULL,
    "bank_code" TEXT,
    "bank_name" TEXT,
    "account_number" TEXT,
    "account_name" TEXT,
    "reference_number" TEXT NOT NULL,
    "provider_reference" TEXT,
    "status" "withdrawal_status" NOT NULL DEFAULT 'PENDING',
    "providerResponse" JSONB,
    "processed_at" TIMESTAMP(3),
    "failed_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "withdrawals_reference_number_key" ON "withdrawals"("reference_number");

-- CreateIndex
CREATE INDEX "idx_withdrawal_user" ON "withdrawals"("user_id");

-- CreateIndex
CREATE INDEX "idx_withdrawal_wallet" ON "withdrawals"("wallet_id");

-- CreateIndex
CREATE INDEX "idx_withdrawal_status" ON "withdrawals"("status");

-- CreateIndex
CREATE INDEX "idx_withdrawal_reference" ON "withdrawals"("reference_number");

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
