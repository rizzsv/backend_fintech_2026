# Fintech Backend Deployment Guide

## Production Safety

**CRITICAL:** This is a portfolio/demo application.

**MUST remain:**
- `PAYMENT_MODE=simulated`
- `MIDTRANS_IS_PRODUCTION=false`

Real money transactions are NOT supported.

## Architecture

- **Runtime:** Node.js 20+
- **Database:** Neon PostgreSQL (fintech-production)
- **Redis:** Upstash Redis (fintech-production-redis)
- **Queue:** Upstash QStash (serverless mode)
- **Payment:** Midtrans Sandbox (simulated)

## Pre-Deployment Checklist

### 1. Environment Configuration

Copy `.env.production.example` to `.env` and fill:

```bash
cp .env.production.example .env
```

Required variables:
- `NODE_ENV=production`
- `PORT` (from provider, usually 3000)
- `DATABASE_URL` (Neon PostgreSQL connection string)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (Upstash Redis)
- `JWT_SECRET` (min 32 chars)
- `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY` (sandbox)
- `QUEUE_PROVIDER=qstash`
- `QSTASH_URL`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`
- `BACKEND_URL` (your deployed backend domain)
- `FRONTEND_URL` (your deployed frontend domain)

### 2. Verify Configuration

```bash
npm run verify:env
```

Expected output:
```
✅ Environment configuration valid
   NODE_ENV: production
   PAYMENT_MODE: simulated
   QUEUE_PROVIDER: qstash
   MIDTRANS_IS_PRODUCTION: false
```

### 3. Database Migration

**IMPORTANT:** Run ONLY on first deployment or after schema changes.

```bash
npx prisma migrate deploy
npx prisma migrate status
```

**DO NOT run:**
- `prisma migrate reset` (destroys data)
- `prisma db push` (bypasses migration history)
- Manual SQL on production

### 4. Build Verification

```bash
npm ci --include=dev
npm run build
npm test
```

Expected:
- Build: ✅ Pass
- Tests: 198/198 pass

## Deployment Methods

### Method 1: Docker (Recommended)

```bash
# Build image
docker build -t fintech-backend .

# Run container
docker run -d \
  --name fintech-backend \
  -p 3000:3000 \
  --env-file .env \
  fintech-backend
```

Health check:
```bash
curl http://localhost:3000/health
```

### Method 2: Node.js Direct

```bash
npm ci --omit=dev
npx prisma generate
npm start
```

### Method 3: Platform-Specific

See **Provider Setup** section below.

## QStash Configuration

After deployment, create reconciliation schedule:

**QStash Dashboard → Schedules → Create Schedule**

- **Destination:** `https://<your-backend-domain>/api/workers/reconciliation`
- **Schedule:** `*/5 * * * *` (every 5 minutes)
- **Method:** POST
- **Headers:** `Content-Type: application/json`
- **Body:** `{}`

**Verify signature verification:**

```bash
curl -X POST https://<your-backend-domain>/api/workers/reconciliation \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: `401 Unauthorized: Missing QStash signature`

## Google OAuth Configuration

Update authorized redirect URIs in Google Cloud Console:

1. Go to APIs & Services → Credentials
2. Select your OAuth 2.0 Client ID
3. Add authorized redirect URI:
   ```
   https://<your-backend-domain>/api/v1/auth/google/callback
   ```

Update environment:
```
FRONTEND_URL=https://<your-frontend-domain>
```

## Health Checks

### /health

```bash
curl https://<your-backend-domain>/health
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "2026-10-04T17:00:00.000Z",
  "database": "healthy",
  "uptime": 123.45
}
```

### /metrics

Prometheus metrics for monitoring.

## Post-Deployment Verification

### 1. Basic Connectivity

```bash
# Health
curl https://<backend>/health

# Redis (via app runtime)
# Check logs for Redis connection success

# Database
# Check logs for Prisma connection success
```

### 2. Worker Endpoints

```bash
# QStash signature required (should fail with 401)
curl -X POST https://<backend>/api/workers/withdrawal \
  -H "Content-Type: application/json" \
  -d '{"withdrawalId":"test"}'
```

Expected: `401 Unauthorized`

### 3. API Endpoints

```bash
# Public endpoint
curl https://<backend>/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
```

Expected: `401` or `400` (not 500)

## Troubleshooting

### Build Fails

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Connection

Check `DATABASE_URL` format:
```
postgresql://user:password@host:5432/dbname?sslmode=require
```

Neon requires `?sslmode=require`.

### Redis Connection

Upstash Redis uses standard Redis protocol.
Check `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.

### QStash Signature Fails

Verify `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` from Upstash dashboard.

Worker endpoints receive raw body: `express.text({ type: "application/json" })`.

### CORS Errors

Verify `FRONTEND_URL` matches actual frontend domain (no trailing slash).

## Monitoring

### Logs

Application uses structured JSON logging (pino).

Filter by level:
- `info` - normal operation
- `warn` - non-critical issues
- `error` - failures requiring attention
- `fatal` - application crash

### Key Metrics

- Request rate: `/metrics`
- Error rate: logs with `level: error`
- Queue health: QStash dashboard
- Database: Neon dashboard

## Rollback

If deployment fails:

1. Revert to previous deploy
2. Check logs for root cause
3. Fix locally
4. Re-test: `npm test && npm run build`
5. Re-deploy

**DO NOT** rollback database migrations without careful planning.

## Security Notes

- All secrets MUST be in environment variables, never hardcoded
- QStash signature verification protects worker endpoints
- JWT tokens for API authentication
- Rate limiting enabled globally
- CORS restricted to `FRONTEND_URL`
- Helmet security headers enabled

## Support

Repository: https://github.com/rizzsv/fintech
Issues: Create GitHub issue with deployment logs
