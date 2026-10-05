#!/usr/bin/env node

/**
 * Production environment verification
 * Run before deployment to catch config issues early
 */

const requiredVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'REDIS_HOST',
  'REDIS_PORT',
  'REDIS_PASSWORD',
  'JWT_SECRET',
  'MIDTRANS_SERVER_KEY',
  'MIDTRANS_CLIENT_KEY',
  'MIDTRANS_BASE_URL',
  'WITHDRAWAL_WEBHOOK_SECRET',
  'BULL_BOARD_USERNAME',
  'BULL_BOARD_PASSWORD',
];

const qstashVars = [
  'QSTASH_URL',
  'QSTASH_TOKEN',
  'QSTASH_CURRENT_SIGNING_KEY',
  'QSTASH_NEXT_SIGNING_KEY',
  'BACKEND_URL',
];

const productionVars = [
  'FRONTEND_URL',
];

console.log('🔍 Verifying environment configuration...\n');

const missing = [];
const warnings = [];

// Check required
for (const key of requiredVars) {
  if (!process.env[key]) {
    missing.push(key);
  }
}

// Check QStash if QUEUE_PROVIDER=qstash
if (process.env.QUEUE_PROVIDER === 'qstash') {
  console.log('✓ QUEUE_PROVIDER=qstash detected, checking QStash config...');
  for (const key of qstashVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
} else {
  console.log(`ℹ QUEUE_PROVIDER=${process.env.QUEUE_PROVIDER || 'bullmq'} (QStash not required)`);
}

// Check production
if (process.env.NODE_ENV === 'production') {
  console.log('✓ NODE_ENV=production detected, checking production config...');
  for (const key of productionVars) {
    if (!process.env[key]) {
      warnings.push(key);
    }
  }
}

// Safety checks
if (process.env.PAYMENT_MODE === 'production') {
  console.error('\n❌ CRITICAL: PAYMENT_MODE=production is NOT allowed for demo/portfolio deployment');
  process.exit(1);
}

if (process.env.MIDTRANS_IS_PRODUCTION === 'true') {
  console.error('\n❌ CRITICAL: MIDTRANS_IS_PRODUCTION=true is NOT allowed for demo/portfolio deployment');
  process.exit(1);
}

// Report
if (missing.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  missing.forEach(key => console.error(`   - ${key}`));
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn('\n⚠️  Missing recommended environment variables:');
  warnings.forEach(key => console.warn(`   - ${key}`));
}

console.log('\n✅ Environment configuration valid');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   PAYMENT_MODE: ${process.env.PAYMENT_MODE || 'simulated'}`);
console.log(`   QUEUE_PROVIDER: ${process.env.QUEUE_PROVIDER || 'bullmq'}`);
console.log(`   MIDTRANS_IS_PRODUCTION: ${process.env.MIDTRANS_IS_PRODUCTION || 'false'}`);
