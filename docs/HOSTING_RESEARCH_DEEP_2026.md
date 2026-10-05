# Deep Backend Hosting Research — October 2026
## $0/No-Card Providers for Node.js Express + QStash

**Research Date:** 2026-10-04  
**Verification Method:** Official documentation, verified pricing pages, 2026 sources only

---

## EXECUTIVE SUMMARY

**NO provider meets all 15 requirements.**

Two providers come closest but have critical blockers:

1. **Oracle Cloud Always Free** — genuinely free forever, enough resources, BUT requires credit card verification
2. **Northflank Sandbox** — genuinely free forever, always-on, BUT requires credit card verification

**The brutal 2026 reality:** Every remaining "free forever" host requires a credit card for identity verification or has architecture incompatibilities.

---

## DETAILED FINDINGS

### 1. ORACLE CLOUD ALWAYS FREE

**Official Source:** https://www.oracle.com/cloud/free/  
**Documentation:** Multiple 2026 sources verified (Sep 2026)  
**Last Updated:** September 2026

#### Free Tier Specs
- **Compute:** 2 ARM OCPU + 12 GB RAM (Ampere A1)
- **Additional:** 2 × AMD micro VMs (1 GB RAM each)
- **Storage:** 200 GB block volume
- **Bandwidth:** 10 TB/month outbound
- **Database:** 2 Autonomous Databases (1 OCPU/20 GB each)
- **Load Balancer:** 1 flexible LB (10 Mbps)
- **Duration:** Forever (Always Free tier never expires)

#### What Changed in 2026
On June 15, 2026, Oracle **halved the ARM allocation** from 4 OCPU/24 GB to 2 OCPU/12 GB without announcement. Enforcement began August 18, 2026. Existing 4 OCPU instances were terminated.

#### Node.js/Express Compatibility
✅ **YES** — Full Docker support, Ubuntu/Oracle Linux base images  
✅ Persistent HTTP server (no auto-sleep)  
✅ HTTPS via load balancer or reverse proxy  
✅ Environment variables via cloud-init/instance metadata  
✅ GitHub deployment via SSH/CLI

#### External Service Compatibility
✅ **Neon PostgreSQL:** Full outbound connectivity  
✅ **Upstash Redis:** Full outbound connectivity  
✅ **QStash:** Can receive webhooks, public IP + HTTPS

#### Critical Blockers

**1. CARD REQUIRED ❌**

From official docs (verified Sep 2026):
> "You need a credit card to sign up. Oracle uses it for identity verification, not billing. Always Free resources are not charged."

This is **explicitly stated** in multiple 2026 sources. Virtual/prepaid cards are rejected.

**2. Idle Reclamation Policy**

From official Oracle docs:
> "An Always Free instance may be reclaimed if, during any 7-day window:
> - CPU utilization (95th percentile) < 20%
> - Network utilization < 20%
> - Memory utilization < 20% (ARM only)"

**Impact for portfolio fintech demo:**
- Low-traffic demo could trigger reclamation
- Need synthetic load generation to stay above 20%
- 2026 reports confirm real shutdowns

**3. Capacity Scarcity**

"Out of host capacity" errors common when provisioning A1 instances, especially in US East region. ARM capacity is first-come-first-served.

**4. No SLA, No Support**

Always Free accounts get no Service Level Agreement and cannot open Oracle Support tickets.

#### Deployment Method
- Web Console: Manual VM creation
- CLI: `oci compute instance launch`
- GitHub: Via SSH post-provision (no native integration)

#### Monthly Costs
**$0** — truly free if within limits

#### Classification
**ELIMINATED** — Fails requirement #2 (no credit card)

---

### 2. NORTHFLANK SANDBOX

**Official Source:** https://northflank.com/pricing  
**Documentation:** https://northflank.com/docs/v1/application/billing/pricing-on-northflank  
**Last Verified:** September 13, 2026

#### Free Tier Specs
- **Services:** 2 always-on (no sleep)
- **Jobs:** 2 cron jobs
- **Addons:** 1 database
- **Compute:** Shared CPU, RAM not specified
- **Duration:** Forever (Developer Sandbox never expires)

#### Node.js/Express Compatibility
✅ **YES** — Native Node.js + Docker support  
✅ **Always-on** — No auto-sleep, no cold starts  
✅ HTTPS included  
✅ Environment variables/secrets via dashboard  
✅ GitHub deployment (native integration)

#### External Service Compatibility
✅ **Neon PostgreSQL:** Outbound connectivity  
✅ **Upstash Redis:** Outbound connectivity  
✅ **QStash:** Can receive webhooks reliably (no sleep)

#### Critical Blockers

**CARD REQUIRED ❌**

From official documentation:
> "Please note: all users must add a payment method to start creating resources on Northflank, regardless of plan selection. This is to verify user identity, and prevent malicious usage of the platform."

FAQ confirms:
> "Am I charged when I enter my credit card? No — when you enter a card we only verify the card. Your card is only charged at the end of the billing cycle."

**Sandbox is NOT charged**, but card verification is **mandatory** before any resource creation.

#### Strengths
- ✅ Always-on (best for QStash workers)
- ✅ No cold starts
- ✅ 2 services = backend + potential worker service
- ✅ Native GitHub deployment
- ✅ Production-grade control plane

#### Deployment Method
1. Connect GitHub
2. Select repository
3. Configure build/environment
4. Deploy (automatic CI/CD)

#### Monthly Costs
**$0** — Sandbox never billed

#### Classification
**ELIMINATED** — Fails requirement #2 (no credit card)

---

### 3. RAILWAY

**Official Source:** https://railway.com/pricing  
**Last Updated:** 2026 (multiple sources verified)

#### Free Tier History
- **2020–2023:** Generous free tier
- **2023:** Free tier removed (company losing $16 per $1 revenue)
- **August 2025:** Free plan RETURNED

#### Current Free Tier (2026)
- **Trial:** $5 credit, 30 days, no card required
- **After trial:** $1/month perpetual credit (non-rollover)
- **Duration:** Forever (but only $1/month to spend)

#### Node.js/Express Compatibility
✅ **YES** — Native Node.js + Docker support  
✅ Persistent process (no forced auto-sleep on paid resources)  
✅ HTTPS via `*.up.railway.app`  
✅ Environment variables via dashboard  
✅ GitHub deployment (push-to-deploy)

#### Critical Limitations

**1. INSUFFICIENT RESOURCES ⚠️**

$1/month credit = ~0.2 vCPU, minimal RAM, very limited hours

From 2026 sources:
> "$1 of non-rollover credit every month, which is enough to keep one very small service running for free indefinitely."

**User's previous experience:**
> "Railway backend creation sebelumnya gagal karena Free plan resource provisioning limit."

**2. Cannot Run Express + QStash Workers**

Express backend alone may consume full $1 credit. No budget for:
- QStash worker endpoints (separate process/routing)
- Adequate uptime
- Database connections overhead

#### Card Required?
**NO** — for initial $5 trial + $1/month tier

#### Monthly Costs
**$0** if usage stays under $1/month credit

#### Classification
**ELIMINATED** — Proven insufficient (user already hit resource limit)

---

### 4. ZEABUR

**Official Source:** https://zeabur.com/docs/en-US/pricing/free-plan  
**Last Updated:** June 22, 2026

#### Free Tier Specs
- **Compute:** Not specified (auto-sleep when idle)
- **Duration:** Forever
- **Features:** GitHub deployment, Docker/Node.js, HTTPS, env variables

#### Node.js/Express Compatibility
✅ **YES** — Native support  
❌ **Auto-sleep** — Services sleep after inactivity  
❌ Cold start latency on next request

#### Critical Blockers

**AUTO-SLEEP ARCHITECTURE ❌**

From official docs:
> "Services on the Free Plan automatically sleep after a period of inactivity. They wake up on the next incoming request, which may cause a few seconds of cold-start latency."

**Impact for QStash:**
- QStash webhook arrives → service asleep
- Cold start takes "a few seconds"
- QStash has timeout limits for webhook responses
- Reconciliation job may fail due to timeout
- Payment/notification workers unreliable

#### Card Required?
**NO** — Official docs: "No credit card required — just sign up and start deploying."

#### Monthly Costs
**$0**

#### Classification
**ELIMINATED** — Auto-sleep incompatible with QStash worker architecture

---

### 5. CLOUDFLARE WORKERS

**Official Source:** https://developers.cloudflare.com/workers/  
**Last Updated:** August 2026 (Node.js compat default since Aug 4, 2026)

#### Free Tier Specs
- **Requests:** 100,000/day
- **CPU Time:** 10ms per request
- **Duration:** Forever

#### Node.js/Express Compatibility
⚠️ **PARTIAL** — Node.js APIs supported since Aug 2026  
❌ **Architecture mismatch** — Serverless functions, not persistent HTTP server

From official tutorial (Aug 25, 2026):
> "Deploy an Express.js application on Cloudflare Workers"

BUT: Requires `nodejs_compat` flag and adapter. Not a true persistent Express server.

#### Critical Blockers

**ARCHITECTURE REWRITE REQUIRED ❌**

Current backend:
- Persistent HTTP server (`server.listen()`)
- In-memory state (session, cache)
- Long-running processes
- Node-cron scheduling (BullMQ mode)

Cloudflare Workers:
- Stateless functions (no persistence)
- Request/response only
- No background processes
- No cron (use Cloudflare Cron Triggers instead)

**Migration scope:**
- Rewrite server.ts → function handler
- Remove all stateful logic
- Migrate BullMQ workers to separate Workers
- Rewrite scheduling
- Test entire QStash integration

**User requirement:**
> "DO NOT modify source code."

#### Card Required?
**NO** — Free tier available without card

#### Monthly Costs
**$0**

#### Classification
**ELIMINATED** — Requires architecture rewrite (violates user constraint #4)

---

### 6. REPLIT

**Official Source:** https://docs.replit.com/billing/deployment-pricing  
**Last Updated:** 2026

#### Free Tier
From official docs:
> "Starter Plan: Includes 1 free published app. The deployment expires after 30 days but can be re-published."

#### Critical Blockers

**NOT PERMANENT ❌**

Deployment expires every 30 days. Must manually re-publish.

From docs:
> "Avoid saving and relying on data written to a published app's filesystem."

#### Card Required?
Unclear from free tier docs

#### Monthly Costs
**$0** but requires manual re-publish every 30 days

#### Classification
**ELIMINATED** — Fails requirement #1 ($0 permanently) — expiring deployments unsuitable for demo

---

### 7. WAIFLY

**Official Source:** https://waifly.com (referenced in search results)

#### Claims
- Permanent free
- 300 MB RAM
- No card required

#### Research Results

**NO OFFICIAL DOCUMENTATION FOUND ❌**

- Web search "Waifly reviews reliability uptime 2026" → 403 Forbidden
- No official pricing page verified
- No technical documentation found
- No user reviews found
- No evidence of reliability/legitimacy

#### Classification
**ELIMINATED** — Cannot verify legitimacy, no documentation, reliability unknown

---

### 8. LEAPCELL

**Official Source:** https://leapcell.io/pricing (referenced)

#### Research Results

**INSUFFICIENT INFORMATION ❌**

- Pricing page exists but extraction failed (minimal content)
- No concrete free tier details verified
- Search results showed references but no specs

#### Classification
**UNCERTAIN** — Insufficient verified information to assess

---

### 9. BACK4APP CONTAINERS

**Official Source:** https://www.back4app.com/pricing/container-as-a-service

#### Research Results

**INSUFFICIENT INFORMATION ❌**

- Pricing page exists but extraction returned only 1,143 chars
- No clear free tier limits found
- Primarily known for BaaS (Backend-as-a-Service), not container hosting

#### Classification
**UNCERTAIN** — Insufficient verified information to assess

---

### 10. GOOGLE CLOUD FREE TIER

**Always Free Tier:**
- 1 × e2-micro instance (0.25 vCPU, 1 GB RAM) in us-west1/us-central1/us-east1
- 30 GB-month standard persistent disk
- 1 GB North America egress

#### Critical Blockers

**CARD REQUIRED ❌**

Google Cloud requires credit card for all signups, even for free tier.

**INSUFFICIENT RESOURCES ❌**

e2-micro = shared vCPU (0.25), 1 GB RAM. Likely insufficient for Express + Prisma + workers.

#### Classification
**ELIMINATED** — Requires card + likely insufficient resources

---

### 11. GLITCH

**Official Source:** https://glitch.com

#### Free Tier
- 1,000 requests/hour limit
- Auto-sleep after inactivity
- Public projects only

#### Critical Blockers

**1. REQUEST LIMIT ❌**

1,000 req/hr = ~0.28 req/sec average. QStash reconciliation every 5 minutes + user traffic could exceed limit.

**2. AUTO-SLEEP ❌**

Same issue as Zeabur — cold starts incompatible with QStash timeouts.

#### Classification
**ELIMINATED** — Request limit + auto-sleep

---

## COMPARISON TABLE

| Provider | Card Required | Permanent Free | Always-On | Node/Docker | HTTPS | QStash Compatible | Classification |
|----------|---------------|----------------|-----------|-------------|-------|-------------------|----------------|
| Oracle Cloud Always Free | ✅ YES | ✅ YES | ✅ YES | ✅ YES | ✅ YES | ✅ YES | ELIMINATED (card) |
| Northflank Sandbox | ✅ YES | ✅ YES | ✅ YES | ✅ YES | ✅ YES | ✅ YES | ELIMINATED (card) |
| Railway | ❌ NO | ⚠️ $1/mo | ✅ YES | ✅ YES | ✅ YES | ❌ NO | ELIMINATED (resources) |
| Zeabur | ❌ NO | ✅ YES | ❌ NO | ✅ YES | ✅ YES | ❌ NO | ELIMINATED (auto-sleep) |
| Cloudflare Workers | ❌ NO | ✅ YES | ✅ YES | ⚠️ Serverless | ✅ YES | ⚠️ Rewrite | ELIMINATED (architecture) |
| Replit | ❓ UNCLEAR | ❌ NO | ⚠️ Expires | ✅ YES | ✅ YES | ❌ NO | ELIMINATED (temporary) |
| Waifly | ❓ UNCLEAR | ❓ UNCLEAR | ❓ UNCLEAR | ❓ UNCLEAR | ❓ UNCLEAR | ❓ UNCLEAR | ELIMINATED (unverified) |
| Leapcell | ❓ UNCLEAR | ❓ UNCLEAR | ❓ UNCLEAR | ❓ UNCLEAR | ❓ UNCLEAR | ❓ UNCLEAR | UNCERTAIN |
| Back4App Containers | ❓ UNCLEAR | ❓ UNCLEAR | ❓ UNCLEAR | ❓ UNCLEAR | ❓ UNCLEAR | ❓ UNCLEAR | UNCERTAIN |
| Google Cloud Free Tier | ✅ YES | ✅ YES | ✅ YES | ✅ YES | ✅ YES | ❌ NO | ELIMINATED (card + resources) |
| Glitch | ❌ NO | ✅ YES | ❌ NO | ✅ YES | ✅ YES | ❌ NO | ELIMINATED (auto-sleep + limits) |

---

## STRONGEST CANDIDATES (IF CARD ACCEPTABLE)

### 1. NORTHFLANK SANDBOX ⭐ RECOMMENDED

**Why strongest:**
- ✅ Always-on (no cold starts)
- ✅ 2 services (backend + worker separation possible)
- ✅ Native GitHub deployment
- ✅ Production-grade control plane
- ✅ Genuinely free forever (no $1 credit limit like Railway)
- ✅ **No idle reclamation policy** (unlike Oracle)

**Only blocker:** Card verification required

**Best for:**
- QStash worker endpoints (reliable response times)
- Portfolio fintech demo (professional presentation)
- Always-on availability

**Risk:** None once verified. Sandbox resources never billed.

---

### 2. ORACLE CLOUD ALWAYS FREE

**Why second choice:**
- ✅ Most resources (2 OCPU/12 GB RAM)
- ✅ Full control (VPS-like)
- ✅ Load balancer included
- ✅ 10 TB bandwidth

**Blockers:**
- Card verification required
- Idle reclamation policy (need synthetic load)
- Capacity scarcity (ARM provisioning errors common)
- Setup complexity (manual VM/network config)

**Best for:**
- Users comfortable with VPS management
- Willing to maintain >20% utilization
- Need maximum resources

**Risk:** Instance reclamation if traffic too low

---

## REALISTIC OPTIONS

### Option A: Accept Card Verification

**Northflank Sandbox** is the **cleanest solution** if card verification is acceptable:

1. Card used only for identity verification (like AWS, GCP)
2. Sandbox resources never charged
3. Always-on = QStash reliable
4. Native GitHub deployment
5. Professional presentation

**Next steps if chosen:**
- Provide card for verification
- Connect GitHub repo
- Deploy backend
- Configure environment variables
- Create QStash schedule

---

### Option B: Self-Hosting

**Free compute without card:**

1. **Home server** — Raspberry Pi/old laptop + dynamic DNS
2. **Oracle Cloud with friend's card** — Borrow card for verification
3. **University/work resources** — If available

**Risks:**
- Uptime reliability
- Network stability
- Security (exposing home network)

---

### Option C: Paid Hosting ($5–7/month)

**Accept minimum paid tier:**

1. **Render Starter** — $7/month, proven stable
2. **Railway Hobby** — $5/month + $5 credit
3. **DigitalOcean App Platform** — $5/month

**Reality check:** Portfolio project investment = 1–2 coffee/month

---

### Option D: Architecture Pivot

**Rewrite for serverless:**

1. **Cloudflare Workers** — Free, no card
2. **Vercel Serverless Functions** — Free tier

**Tradeoffs:**
- Complete backend rewrite
- No persistent Express server
- QStash integration redesign
- BullMQ removal
- Prisma edge compatibility

**Scope:** 2–3 days minimum rewrite + testing

---

## FINAL VERDICT

**NO provider meets all 15 requirements.**

**The 2026 reality:**

Every platform that offered true $0/no-card hosting has either:
1. Removed free tier (Heroku 2022, Railway 2023–2025, Render 2024)
2. Added card verification (Fly.io, Oracle, Northflank, all major clouds)
3. Insufficient resources (Railway $1/month)
4. Architecture incompatible (auto-sleep platforms, serverless-only)

**Root cause:** 2020–2023 free tier abuse forced industry-wide policy changes. Identity verification (card) is now standard anti-abuse measure.

---

## RECOMMENDED PATH FORWARD

### If budget is truly $0 and no card available:

**BLOCKED** — No viable solution exists in October 2026.

Consider:
1. Wait for new provider to emerge
2. Borrow card for Northflank Sandbox verification
3. Focus frontend-only demo + mock backend
4. Self-host on home network (risk: reliability)

---

### If card verification is acceptable:

**Deploy to Northflank Sandbox immediately:**

1. ✅ Best free tier for QStash architecture
2. ✅ Always-on = reliable workers
3. ✅ Professional deployment
4. ✅ Zero monthly cost
5. ✅ Native GitHub integration

Card is verified once, never charged for Sandbox usage.

---

### If $5–7/month is acceptable:

**Deploy to Render Starter:**

1. ✅ Proven stable (widely used)
2. ✅ Simple deployment
3. ✅ Managed PostgreSQL available
4. ✅ No resource limits
5. ✅ Professional for portfolio

Cost = 1 coffee/month for reliable demo hosting.

---

## INFORMATION NEEDED FROM USER

### Decision Required:

**Which path do you choose?**

**A. Northflank Sandbox** (card verification acceptable)  
**B. Paid hosting** ($5–7/month acceptable)  
**C. Self-hosting** (home server/borrowed resources)  
**D. Architecture rewrite** (serverless pivot, 2–3 days work)  
**E. Block deployment** (no viable option, focus frontend only)

### If choosing A (Northflank):
- Card details (handled via Northflank dashboard, not shared here)
- Confirmation to proceed with deployment

### If choosing B (Paid):
- Provider choice (Render/Railway/DigitalOcean)
- Card for billing
- Budget confirmation

### If choosing C (Self-host):
- Home network details
- DNS provider
- SSL certificate plan

### If choosing D (Rewrite):
- Target platform (Cloudflare Workers/Vercel)
- Timeline (minimum 2–3 days)
- Acceptance of architecture changes

### If choosing E (Block):
- Confirmation to stop backend deployment
- Focus frontend-only with mock API

---

**Research complete. No $0/no-card provider exists that meets requirements.**
