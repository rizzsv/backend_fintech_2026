import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(60));
  console.log('DATABASE DATA RESET');
  console.log('='.repeat(60));
  console.log(`Target: ${process.env.DATABASE_URL?.split('@')[1] || 'unknown'}`);
  console.log('');

  // 1. Show current table info
  console.log('CURRENT TABLES (excluding _prisma_migrations):');
  console.log('-'.repeat(60));
  
  const tables = [
    'users',
    'otp_codes',
    'sessions',
    'user_devices',
    'wallets',
    'user_limits',
    'transactions',
    'transaction_logs',
    'ledger_entries',
    'Payment',
    'withdrawals',
    'kyc_requests',
    'fraud_cases',
    'notifications',
    'notification_preferences',
    'audit_logs',
  ];

  const counts: Record<string, number> = {};
  
  for (const table of tables) {
    try {
      const result = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM "${table}"`
      );
      counts[table] = Number(result[0].count);
      console.log(`  ${table.padEnd(30)} ${counts[table]} rows`);
    } catch (err) {
      console.log(`  ${table.padEnd(30)} [table not found or error]`);
    }
  }

  console.log('');
  console.log('MIGRATION TABLE:');
  console.log('-'.repeat(60));
  const migrations = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "_prisma_migrations"
  `;
  console.log(`  _prisma_migrations: ${Number(migrations[0].count)} rows`);
  console.log('');

  // 2. Confirm with user (manual check)
  console.log('⚠️  DESTRUCTIVE OPERATION');
  console.log('This will TRUNCATE all application tables.');
  console.log('Migration history (_prisma_migrations) will be PRESERVED.');
  console.log('');
  console.log('If this is correct, re-run with --execute flag:');
  console.log('  npm run reset-data -- --execute');
  console.log('');

  if (!process.argv.includes('--execute')) {
    console.log('DRY RUN - no changes made');
    return;
  }

  console.log('EXECUTING DATA RESET...');
  console.log('');

  // 3. Truncate all tables with CASCADE
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "users",
      "otp_codes",
      "sessions",
      "user_devices",
      "wallets",
      "user_limits",
      "transactions",
      "transaction_logs",
      "ledger_entries",
      "Payment",
      "withdrawals",
      "kyc_requests",
      "fraud_cases",
      "notifications",
      "notification_preferences",
      "audit_logs"
    RESTART IDENTITY CASCADE
  `);

  console.log('✓ All application tables truncated');
  console.log('');

  // 4. Verify counts after reset
  console.log('VERIFICATION (after reset):');
  console.log('-'.repeat(60));
  
  for (const table of tables) {
    try {
      const result = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM "${table}"`
      );
      const count = Number(result[0].count);
      console.log(`  ${table.padEnd(30)} ${count} rows ${count === 0 ? '✓' : '✗ ERROR'}`);
    } catch (err) {
      console.log(`  ${table.padEnd(30)} [error checking]`);
    }
  }

  console.log('');
  
  // 5. Verify migration table still intact
  const migrationsAfter = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "_prisma_migrations"
  `;
  const migrationCount = Number(migrationsAfter[0].count);
  console.log(`  _prisma_migrations: ${migrationCount} rows ${migrationCount > 0 ? '✓' : '✗ ERROR'}`);
  console.log('');
  
  console.log('='.repeat(60));
  console.log('DATA RESET COMPLETE');
  console.log('='.repeat(60));
}

main()
  .catch((err) => {
    console.error('Error during reset:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
