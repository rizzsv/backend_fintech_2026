# Fintech Backend

RESTful API backend for a secure fintech platform providing wallet management, financial transactions, and comprehensive user services.

## Overview

This is the backend API server for the fintech platform. Built with Node.js and TypeScript, it provides authentication, wallet operations, transaction processing, KYC verification, fraud detection, and financial analytics.

## Features

### Authentication & Authorization
- User registration with email verification (OTP)
- Secure login with JWT access and refresh tokens
- Password reset flow (OTP-based)
- Google OAuth integration
- Session management
- Demo account creation for testing

**Note**: Normal login does NOT require OTP. OTP is only used for email verification during registration and password reset.

### Wallet Management
- Unique account number generation
- Real-time balance tracking
- Multi-currency support (IDR default)
- Balance history and versioning
- Wallet freeze capability

### Transactions
- Money transfers between accounts
- Top-up (add funds)
- Withdrawal processing
- Transaction history with filtering
- Idempotency keys for safe retries
- Optimistic locking for concurrency

### Financial Operations
- Double-entry ledger system
- Atomic transaction processing
- Fee calculation and management
- Transfer limit enforcement
- Transaction reconciliation

### KYC (Know Your Customer)
- Document upload and verification
- Multi-tier KYC levels (BASIC, INTERMEDIATE, ADVANCED)
- Status tracking (PENDING, APPROVED, REJECTED)
- Selfie verification support

### Fraud Detection
- Rule-based fraud scoring
- Transaction pattern analysis
- Risk assessment
- Automated case creation
- Manual review workflow

### Notifications
- Email notifications via Resend
- Notification preferences
- Multi-channel support architecture
- Template-based messaging

### Dashboard & Analytics
- Financial overview
- Income vs expense tracking
- Cash flow analysis
- Transaction summaries

### Demo Mode
- Isolated demo accounts
- Simulated financial operations
- Pre-populated test data
- No real money involved
- Safe testing environment

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5
- **Framework**: Express.js
- **Database**: PostgreSQL (via Neon)
- **ORM**: Prisma
- **Cache/Session**: Redis (via Upstash)
- **Queue**: BullMQ with Upstash Redis
- **Email**: Resend
- **Validation**: Zod
- **Logging**: Pino
- **Testing**: Vitest
- **Deployment**: Vercel (serverless)

## Architecture

### Layered Architecture

```
Controller → Service → Repository → Database
```

- **Controller**: HTTP request/response handling, validation
- **Service**: Business logic, transaction orchestration
- **Repository**: Data access layer, Prisma queries
- **Middleware**: Authentication, authorization, rate limiting, error handling

### Project Structure

```
src/
├── modules/              # Feature modules
│   ├── auth/            # Authentication & registration
│   ├── wallet/          # Wallet management
│   ├── transaction/     # Transaction processing
│   ├── payment/         # Payment gateway integration
│   ├── withdrawal/      # Withdrawal processing
│   ├── kyc/            # KYC verification
│   ├── fraud/          # Fraud detection
│   ├── notification/   # Notification system
│   ├── dashboard/      # Analytics & dashboard
│   ├── ledger/         # Double-entry bookkeeping
│   ├── audit/          # Audit logging
│   └── fee/            # Fee calculation
├── shared/              # Shared utilities
│   ├── config/         # Environment & configuration
│   ├── middleware/     # Express middleware
│   ├── logger/         # Pino logger
│   ├── queue/          # BullMQ queue setup
│   └── monitoring/     # Health checks
├── routes/              # API route definitions
├── app.ts              # Express app setup
└── server.ts           # Server entry point
```

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Create new user account
- `POST /login` - Login with email/password
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout and invalidate session
- `POST /demo` - Create demo account
- `POST /forgot-password` - Request password reset OTP
- `POST /reset-password` - Reset password with OTP
- `POST /verify-email` - Verify email with OTP
- `POST /resend-verification` - Resend verification OTP
- `GET /google` - Google OAuth initiation
- `GET /google/callback` - Google OAuth callback

### Wallet (`/api/v1/wallet`)
- `GET /wallet` - Get user wallet details
- `GET /wallet/balance` - Get current balance
- `GET /wallet/history` - Get balance history

### Transactions (`/api/v1/transaction`)
- `GET /transaction` - List transactions with filters
- `GET /transaction/:id` - Get transaction details
- `POST /transaction/transfer` - Transfer money
- `POST /transaction/topup` - Add funds to wallet
- `POST /transaction/withdraw` - Withdraw funds

### Dashboard (`/api/v1/dashboard`)
- `GET /dashboard` - Get dashboard summary
- `GET /dashboard/cashflow` - Get cash flow data

### Notifications (`/api/v1/notifications`)
- `GET /notifications` - List user notifications
- `PATCH /notifications/:id/read` - Mark as read
- `GET /notifications/preferences` - Get preferences
- `PUT /notifications/preferences` - Update preferences

### KYC (`/api/v1/kyc`)
- `POST /kyc/upload` - Upload KYC documents
- `GET /kyc/status` - Get KYC status

### Payment (`/api/v1/payment`)
- `POST /payment` - Create payment
- `GET /payment/:id` - Get payment status

### Withdrawal (`/api/v1/withdrawal`)
- `POST /withdrawal` - Request withdrawal
- `GET /withdrawal/:id` - Get withdrawal status
- `POST /withdrawal/webhook` - Webhook for status updates

## Database

### Prisma ORM

Primary models:
- `User`: User accounts and authentication
- `Wallet`: User wallets and balances
- `Transaction`: Financial transactions
- `LedgerEntry`: Double-entry ledger
- `Payment`: Payment records
- `Withdrawal`: Withdrawal requests
- `KycRequest`: KYC verification
- `FraudCase`: Fraud detection cases
- `Notification`: User notifications
- `Session`: Authentication sessions
- `OtpCode`: OTP codes for verification

### Migrations

```bash
# Run pending migrations
npx prisma migrate deploy

# Create new migration (development)
npx prisma migrate dev --name migration_name

# Generate Prisma Client
npx prisma generate
```

## Redis

Used for:
- Session storage
- Rate limiting
- Queue management (BullMQ)
- Cache

Production uses Upstash Redis (REST API).

## Environment Variables

Create `.env` file:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis (Upstash)
REDIS_HOST=your-redis.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:3002

# Queue (optional, defaults to 'none' for serverless)
QUEUE_PROVIDER=bullmq

# Node environment
NODE_ENV=development
PORT=3000
```

**Never commit real credentials or secrets.**

## Local Development

### Prerequisites

- Node.js 20.19+ or 22+
- PostgreSQL database
- Redis instance (optional for development)

### Installation

```bash
npm install
```

### Database Setup

```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Seed database (if seed script exists)
npm run seed
```

### Development Server

```bash
npm run dev
```

Runs on `http://localhost:3000` by default.

### Build

```bash
npm run build
```

### Production Server

```bash
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.ts

# Watch mode
npm run test:watch
```

### Linting

```bash
npm run lint
```

## Deployment

Deployed to Vercel as serverless functions.

**Required services:**
- Neon PostgreSQL database
- Upstash Redis
- Resend email service

**Environment variables must be configured in Vercel:**
All variables from `.env` must be set in Vercel project settings.

### Vercel Build Configuration

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

See `docs/VERCEL_DEPLOYMENT.md` for detailed deployment guide.

## Security

### Implemented Controls

- **Authentication**: JWT access + refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Zod schemas on all endpoints
- **IDOR Protection**: User-scoped queries, ownership checks
- **OTP Protection**: Rate limiting, attempt limits, expiry
- **OAuth Security**: State parameter for CSRF protection
- **Transaction Safety**: Optimistic locking, idempotency keys
- **Rate Limiting**: Global and endpoint-specific limits
- **Audit Logging**: All sensitive operations logged
- **Session Management**: Secure session storage in Redis
- **Password Security**: Bcrypt hashing
- **Demo Isolation**: Demo accounts completely isolated

### OTP Security

- 6-digit numeric codes
- Bcrypt hashed storage
- 10-minute expiry
- 3 attempt limit
- Rate limiting on generation

## Demo Mode

Demo accounts:
- Separate user flag (`isDemo: true`)
- Isolated from real accounts
- Simulated transaction processing
- Pre-populated test data
- No real money
- Safe for testing and demonstrations

Create demo account via `POST /api/v1/auth/demo`.

## Related Repositories

- Frontend: [rizzsv/fintech-design](https://github.com/rizzsv/fintech-design)

## License

Private repository. All rights reserved.
