# Vercel Deployment Guide — Fintech Backend

## Overview

This backend has been simplified for **Vercel Hobby** deployment (serverless).

**Architecture:**
- Express backend → Vercel Function
- Neon PostgreSQL (persistent database)
- Upstash Redis (required for security)
- Simulated payment processing (no real money)

**Cost:** $0/month (Vercel Hobby + Upstash free tier)

---

## Prerequisites

1. **Vercel account** (free)
2. **Neon PostgreSQL** database (already created)
3. **Upstash Redis** instance (already created)
4. **Google OAuth** credentials configured
5. **Midtrans Sandbox** account (for simulated payments)

---

## Simplified Features

### ✅ Enabled

- Authentication (registration OTP, login, password reset, Google OAuth)
- Dashboard
- Wallet (balance, account number)
- Top-up (simulated, synchronous)
- Transfer (atomic, instant)
- Withdrawal (simulated, synchronous)
- Transaction history
- In-app notifications
- Demo account + reset

### ❌ Disabled for Serverless

- **KYC document upload** — ephemeral filesystem, returns 501 Not Implemented
- **Bull Board monitoring** — BullMQ workers not used
- **Background queue workers** — replaced with synchronous processing
- **Transactional emails** — only OTP emails (registration, password reset)

---

## Environment Variables (Vercel Dashboard)

Configure these in Vercel project settings → Environment Variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host.neon.tech:5432/dbname?sslmode=require

# Redis (REQUIRED for security)
REDIS_HOST=your-redis.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-redis-password

# JWT
JWT_SECRET=min-32-characters-secure-random-string
JWT_REFRESH_SECRET=min-32-characters-secure-random-string

# SMTP (OTP emails only)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=noreply@yourapp.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-***
GOOGLE_CALLBACK_URL=https://your-backend.vercel.app/api/v1/auth/google/callback

# Midtrans (Sandbox)
MIDTRANS_SERVER_KEY=SB-Mid-server-***
MIDTRANS_CLIENT_KEY=SB-Mid-client-***
MIDTRANS_BASE_URL=https://api.sandbox.midtrans.com/v2
MIDTRANS_IS_PRODUCTION=false

# Financial Mode (CRITICAL - MUST BE SIMULATED)
PAYMENT_MODE=simulated

# URLs
BACKEND_URL=https://your-backend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app

# Runtime
NODE_ENV=production
LOG_LEVEL=info

# Features (disabled)
ENABLE_BULL_BOARD=false
```

**CRITICAL:** Never enable real-money mode:
- `PAYMENT_MODE=simulated` (required)
- `MIDTRANS_IS_PRODUCTION=false` (required)

---

## Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "feat: Vercel serverless deployment"
git push origin main
```

### 2. Import Project to Vercel

1. Go to https://vercel.com/new
2. Import Git Repository → Select `rizzsv/fintech`
3. **Root Directory:** `fintech-backend` (important!)
4. Framework Preset: Other
5. Build Command: `npm run vercel-build`
6. Output Directory: (leave empty, serverless functions don't need it)

### 3. Configure Environment Variables

In Vercel project settings:
- Add all variables from `.env.vercel.example`
- Use **Production** environment for all variables
- Never paste secrets in chat/logs

### 4. Deploy

Vercel auto-deploys on push to `main`.

First deployment URL: `https://fintech-backend-[random].vercel.app`

### 5. Update Callback URLs

After first deployment, update:

1. **Vercel environment variables:**
   ```
   BACKEND_URL=https://fintech-backend-[random].vercel.app
   GOOGLE_CALLBACK_URL=https://fintech-backend-[random].vercel.app/api/v1/auth/google/callback
   ```

2. **Google Cloud Console:**
   - Authorized redirect URIs:
     - Add `https://fintech-backend-[random].vercel.app/api/v1/auth/google/callback`

3. **Redeploy** (Vercel dashboard → Deployments → Redeploy)

---

## Verification

### Health Check

```bash
curl https://your-backend.vercel.app/health
```

Expected:
```json
{
  "status": "healthy",
  "timestamp": "2026-10-04T...",
  "database": true,
  "redis": true
}
```

### Test Endpoints

```bash
# Registration (should work)
curl -X POST https://your-backend.vercel.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User","phoneNumber":"+6281234567890"}'

# KYC Upload (should return 501)
curl -X POST https://your-backend.vercel.app/api/v1/kyc/documents \
  -H "Authorization: Bearer [token]"

# Expected: 501 Not Implemented
```

---

## Local Development

Local development still uses persistent server:

```bash
npm run dev
```

Server listens on `http://localhost:3000` (not serverless).

---

## Architecture Changes

### Before (Persistent Server)

```
Express app.listen() → BullMQ workers → Redis queues
```

### After (Serverless)

```
Vercel Function (api/index.ts) → Synchronous processing → Redis (security only)
```

### Key Files

- `api/index.ts` — Vercel serverless entrypoint (NEW)
- `src/app.ts` — Express app (Bull Board disabled)
- `src/server.ts` — Conditional startup (only when run directly)
- `vercel.json` — Routing configuration (NEW)

---

## Security Notes

### Redis REQUIRED

Redis cannot be removed. Used for:
- ✅ OTP replay protection (registration, password reset)
- ✅ OTP rate limiting (brute force prevention)
- ✅ Google OAuth CSRF protection (state validation)
- ✅ Idempotency keys (prevent double withdrawals)
- ✅ Distributed locks (race condition prevention)

Without Redis:
- ❌ OTP can be reused (security vulnerability)
- ❌ OAuth vulnerable to CSRF attacks
- ❌ Double withdrawal possible
- ❌ Race conditions in concurrent requests

**Solution:** Upstash Redis free tier (10K commands/day, sufficient for portfolio).

### Financial Safety

- All operations simulated (`PAYMENT_MODE=simulated`)
- No real bank API calls
- Midtrans sandbox only
- Instant withdrawal completion (demo mode)
- No real money processing

---

## Troubleshooting

### Build Fails: Module Not Found

**Cause:** TypeScript compilation errors.

**Fix:**
```bash
npm run typecheck
# Fix errors, then redeploy
```

### Health Check Returns 503

**Cause:** Database or Redis connection failed.

**Fix:**
1. Verify `DATABASE_URL` format correct (sslmode=require)
2. Verify `REDIS_*` credentials correct
3. Check Vercel logs for connection errors

### KYC Upload Returns 501

**Expected behavior.** KYC upload disabled in serverless deployment.

Frontend should show: "KYC unavailable in demo deployment"

### Withdrawal Not Processing

**Check:** `PAYMENT_MODE=simulated` set in environment variables.

Without it, withdrawal execution won't trigger.

---

## Cost Breakdown

- **Vercel Hobby:** $0/month
- **Neon PostgreSQL:** $0/month (free tier, 0.5GB storage)
- **Upstash Redis:** $0/month (free tier, 10K commands/day)
- **Total:** $0/month

---

## Limitations (Serverless)

1. **Cold starts:** First request after idle ~5-10s
2. **No persistent filesystem:** KYC upload disabled
3. **No background workers:** Reconciliation disabled
4. **Function timeout:** 10s (Hobby), 60s (Pro)
5. **No websockets:** Real-time notifications not supported

**Acceptable for portfolio/demo use case.**

---

## Migrating to Persistent Server (Future)

If you need:
- KYC document upload
- Background reconciliation
- Real-time features
- Long-running processes

Deploy to:
- Railway ($5/mo)
- Render ($7/mo)
- DigitalOcean App Platform ($5/mo)

Use existing `Dockerfile` and `DEPLOYMENT.md`.

---

## Support

For deployment issues:
1. Check Vercel logs (Dashboard → Deployments → View Function Logs)
2. Verify environment variables set correctly
3. Test `/health` endpoint first
4. Check this guide's Troubleshooting section

---

**Last Updated:** 2026-10-04  
**Deployment Type:** Vercel Serverless (Hobby Plan)  
**Architecture:** Simplified for portfolio/demo use
