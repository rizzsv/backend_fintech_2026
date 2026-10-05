# Free Backend Hosting Provider Research (October 2026)

## Research Date: 2026-10-04

## Summary

**Result:** No viable $0/no-card provider found for Express.js backend with QStash requirements.

**User reported failures:**
- Railway: Free plan resource provisioning limit
- Render: HTTP 402 payment information required

## Provider Analysis

### 1. Render ❌ NOT VIABLE

**Status:** Requires payment method (2026)

**Evidence:**
- User reported: "HTTP 402 Payment information required"
- Pricing page (2026-09-03): Hobby plan $0/mo exists
- **Critical change (2026-04-23):** Bandwidth dropped from 100 GB → 5 GB/month
- Free services spin down after 15 min idle
- Free Postgres expires after 30 days

**Why not viable:**
User already attempted deployment and received payment requirement error.

### 2. Railway ❌ NOT VIABLE

**Status:** No permanent free tier (as of 2024-10-07)

**Evidence:**
- User reported: "Free plan resource provisioning limit"
- Current offering: $5 one-time trial (30 days), then $1/month credit
- $1/month = ~100 MB RAM for 30 days = insufficient for Express backend
- Realistic entry: Hobby $5/month minimum

**Why not viable:**
User already attempted deployment and hit provisioning limits.

### 3. Fly.io ❌ NOT VIABLE

**Status:** No free tier (as of 2024-10-07)

**Evidence:**
- Legacy free allowances discontinued October 7, 2024
- Current: 7-day trial with 2 hours machine runtime OR 7 days (whichever first)
- Trial machines auto-stop after 5 minutes
- **Critical:** Adding card ends trial immediately
- No permanent free tier for new accounts

**Why not viable:**
- 2 hours runtime = ~1 day of testing at most
- Production deployment requires immediate payment
- Trial explicitly not meant for sustained hosting

### 4. Vercel ❌ NOT VIABLE

**Status:** Serverless functions only, not Express backend

**Evidence:**
- Hobby plan: free, no card required
- **Architecture mismatch:** Runs serverless/edge functions, NOT long-running processes
- Express server requires persistent port + WebSockets = incompatible
- Would require complete rewrite to serverless architecture

**Why not viable:**
Cannot run Express.js backend. Requires fundamental architecture change.

### 5. Netlify ❌ NOT VIABLE

**Status:** Same as Vercel - serverless only

**Evidence:**
- Free tier exists (300 credits/month as of late 2025)
- Functions have 10-second default timeout (26s on paid)
- **Architecture mismatch:** Designed for static + API routes, not Express server

**Why not viable:**
Cannot run persistent Node.js backend.

### 6. Koyeb ⚠️ UNCERTAIN

**Status:** Claims free tier exists, card requirement unclear

**Evidence:**
- Starter plan: $0/month, 512 MB RAM, 0.1 vCPU
- **Critical:** Services scale to zero after 1 hour idle
- Multiple sources report "card required for verification"
- Free PostgreSQL included

**Why uncertain:**
Conflicting information on card requirement. Worth investigating but likely requires card.

### 7. GoDaddy Node.js Hosting ⚠️ UNCERTAIN

**Status:** Launched August 2026, claims free preview

**Evidence:**
- Up to 2 preview apps free, no card required
- Preview apps are private (login-required)
- **Limitation:** Publishing requires paid Web Hosting plan
- Real Node.js 22 process, not serverless

**Why uncertain:**
Free tier is "preview only" - not publicly accessible. Unclear if suitable for demo portfolio.

### 8. Northflank ⚠️ MAYBE VIABLE

**Status:** Free tier exists but card required

**Evidence:**
- Sandbox: 2 services that never sleep, free forever
- **Critical:** Card required for verification (not charged)
- Small compute (suitable for lightweight API)
- Paid compute starts <$3/month

**Why maybe:**
Actually free-tier with always-on services, but requires card verification.

### 9. Waifly 🔍 NEEDS INVESTIGATION

**Status:** Claims permanent free tier, no card

**Evidence (from waifly.com/guides/free-nodejs-hosting):**
- 300 MB RAM, 1 GB storage, 1 MySQL database
- 30% of CPU core
- No credit card, no trial period, no expiry
- Container-based (Pterodactyl), not VPS
- No SSH/root access

**Why needs investigation:**
Only provider claiming permanent free Node.js hosting with no card requirement. Suspiciously good - verify legitimacy and actual availability.

### 10. Bonto 🔍 NEEDS INVESTIGATION

**Status:** Claims 75 hrs/month free, no card

**Evidence (from bonto.dev):**
- Free tier: 75 hrs/month, 512 MB RAM, 256 MB storage
- Auto-sleep after 30 minutes
- Browser-based Monaco editor
- Node.js 18/20/22 supported

**Why needs investigation:**
75 hrs/month = ~2.5 hours/day runtime. Insufficient for always-on demo but worth evaluating.

## Discontinued/Shutdown Providers

**DO NOT USE:**
- Heroku free tier: Removed November 2022
- Cyclic: Shut down 2024
- Glitch app hosting: Ended 2025
- Deta: Sunset 2025
- Fly.io free allowances: Discontinued October 2024

## Production Requirements vs Free Tier Reality

**Our Requirements:**
- Express.js backend (long-running process)
- QStash HTTP endpoints (must accept POST requests)
- Upstash Redis connection
- Neon PostgreSQL connection
- HTTPS public endpoint
- Environment variables
- ~512 MB RAM minimum
- Portfolio/demo traffic (low, but 24/7 availability preferred)

**Free Tier Reality 2026:**
- Most providers eliminated true free tiers (2024-2025)
- Remaining free tiers:
  - Auto-sleep after 15-30 min idle
  - 5-100 GB bandwidth caps
  - Trial credits that expire
  - Card verification required
  - Private-only deployment

## Recommendation

### Option A: Paid Hosting (Recommended)

**Best choice: Render Hobby → Paid Starter**

1. Deploy to Render with card on file
2. Accept 15-min auto-sleep on Hobby (free)
3. Upgrade to Starter $7/month for always-on when needed

**Why:**
- Proven deployment path
- Standard Express.js support
- HTTPS + custom domain
- Managed Postgres available
- Clear pricing

**Alternative: Railway Hobby $5/month**
- Includes $5 usage credit
- Better for variable traffic
- More expensive at scale

### Option B: Investigate Uncertain Providers

**Priority order:**

1. **Waifly** - If legit, only true permanent free option
   - Verify: Actual sign-up process, service quality, uptime
   - Risk: Sounds too good, may be unreliable

2. **Northflank Sandbox** - Card verification required but truly free
   - Always-on (no sleep)
   - Small but sufficient for demo
   - Upgrade path clear

3. **GoDaddy Node.js Hosting** - Preview tier
   - Check: Can preview be made public?
   - If not, useless for portfolio

### Option C: Architecture Change

**Rewrite backend as serverless functions:**
- Use Vercel/Netlify serverless functions
- Refactor Express routes → individual functions
- BullMQ → QStash only (no persistent workers)
- Significant effort, but genuine free tier available

**Not recommended** unless free hosting is absolute requirement.

## What Information Needed Next

**To proceed with paid hosting:**
1. Confirm budget approval for $5-7/month
2. Provide payment method for deployment
3. Neon PostgreSQL connection string
4. Upstash Redis credentials
5. QStash credentials
6. Frontend domain (for CORS)

**To investigate Waifly/Northflank:**
1. Authorization to test sign-up with actual credentials
2. Acceptance of card verification (Northflank)
3. Willingness to migrate if provider proves unreliable

**To pursue serverless rewrite:**
1. Time budget for architecture change
2. Understanding that BullMQ workers cannot run serverless
3. QStash-only mode tested and accepted
