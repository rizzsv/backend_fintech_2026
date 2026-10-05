# Fintech API Documentation

## Scope

This document consolidates the fintech project’s API specification,
current backend code/logs, Prisma schema, and frontend API contract. It
intentionally separates **confirmed/current implementation** from
**specification/target endpoints** so undocumented routes are not
presented as implemented.

## Base URL

``` text
http://localhost:3000
```

API prefix:

``` text
/api/v1
```

## Global conventions

Protected endpoints use:

``` http
Authorization: Bearer <access_token>
```

JSON endpoints use:

``` http
Content-Type: application/json
```

KYC document submission uses:

``` http
Content-Type: multipart/form-data
```

Financial mutations may require:

``` http
Idempotency-Key: <unique-key>
```

The backend also emits request IDs through `X-Request-ID`.

## Standard response

Conceptual success envelope from the project specification:

``` json
{
  "status": "success",
  "data": {},
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "uuid",
    "version": "v1"
  }
}
```

Observed current backend error envelope:

``` json
{
  "success": false,
  "message": "Internal Server Error"
}
```

Therefore, the current `ResponseUtils` and global error handler are the
source of truth for exact response formatting.

------------------------------------------------------------------------

# 1. Authentication

## POST /api/v1/auth/register

**Status:** SPECIFICATION / CURRENT ROUTE NOT DIRECTLY VERIFIED.

Creates a user and wallet, generates email verification data, and sends
verification email.

Example request:

``` json
{
  "email": "user@example.com",
  "phone_number": "+62812345678",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

Specification also describes `date_of_birth` and `nationality_code`.

Success `201`:

``` json
{
  "status": "success",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "phone_number": "+62812345678",
    "kyc_status": "not_started",
    "message": "Registration successful. Verify your email within 24 hours."
  }
}
```


Errors: `400`, `409`, `429`.

## POST /api/v1/auth/verify-email

**Status:** SPECIFICATION.

``` json
{
  "email": "user@example.com",
  "verification_token": "token_from_email"
}
```

Success `200` verifies the user’s email.

Errors: `400` invalid/expired token, `404` user not found, `409` already
verified.

## POST /api/v1/auth/login

**Status: CONFIRMED CURRENT IMPLEMENTATION.**

The current backend successfully performs user lookup, creates a
session, and returns HTTP `200`.

Example request:

``` json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

The specification additionally documents optional device information.

Conceptual success:

``` json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt",
    "refreshToken": "refresh-token",
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
}
```

Do not place real credentials or tokens in logs or documentation.

Errors: `401`, `403`, `412`, `429`.

The current session contains fields including `userId`,
`refreshTokenHash`, `isActive`, `is2FAVerified`, and `expiresAt`.

## POST /api/v1/auth/refresh-token

**Status:** SPECIFICATION.

``` json
{
  "refresh_token": "refresh-token"
}
```

Success:

``` json
{
  "status": "success",
  "data": {
    "access_token": "new_jwt_token",
    "expires_in": 3600
  }
}
```

Invalid/expired token: `401`.

## POST /api/v1/auth/logout

**Status:** SPECIFICATION.

Bearer authentication required.

Success:

``` json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

## POST /api/v1/auth/enable-2fa

**Status:** SPECIFICATION / CURRENT TASK PARKED.

Example:

``` json
{
  "phone_number": "+62812345678",
  "2fa_method": "sms"
}
```

Supported specification methods: `sms`, `email`.

## POST /api/v1/auth/verify-2fa

**Status:** SPECIFICATION / CURRENT TASK PARKED.

``` json
{
  "otp_code": "123456",
  "device_id": "uuid"
}
```

Errors: `401` invalid OTP, `410` expired OTP, `429` too many attempts.

## POST /api/v1/auth/request-password-reset

**Status:** SPECIFICATION.

``` json
{
  "email": "user@example.com"
}
```

Returns a deliberately generic success response to reduce email
enumeration.

## POST /api/v1/auth/reset-password

**Status:** SPECIFICATION.

``` json
{
  "token": "reset-token",
  "new_password": "NewPass456!"
}
```

Errors: `400` invalid/expired token or weak password, `401` invalid
token.

------------------------------------------------------------------------

# 2. Wallet

## GET /api/v1/wallet/balance

**Status:** WALLET FUNCTIONALITY CONFIRMED; CURRENT ROUTE SOURCE NOT
RETRIEVED DIRECTLY.

Conceptual success:

``` json
{
  "status": "success",
  "data": {
    "wallet_id": "uuid",
    "balance": "1500000.00",
    "currency": "IDR",
    "wallet_status": "active"
  }
}
```

The specification also describes daily limits.

Balance cache:

``` text
wallet:{user_id}:balance
TTL: 30 seconds
```

## GET /api/v1/wallet/transactionsSummary

**Status:** SPECIFICATION.

Supports pagination, transaction type/status, sorting, and date filters.

## POST /api/v1/wallet/withdrawal

**Status:** SPECIFICATION; withdrawal reconciliation scheduler is
present in current bootstrap logs.

Example:

``` json
{
  "amount": 500000,
  "payment_method_id": "uuid",
  "idempotency_key": "uuid"
}
```

Success `202` represents a pending withdrawal.

Errors include `400` insufficient balance/limit, `403` frozen account,
`409` duplicate idempotency key, and `429` rate limiting.

------------------------------------------------------------------------

# 3. Payment / Top Up

## POST /api/v1/payment/topup

**Status: CONFIRMED CURRENT ROUTE.**

Current validator accepts:

``` text
qris
gopay
bank_transfer
shopeepay
```

Current request shape:

``` json
{
  "amount": 500000,
  "paymentMethod": "qris"
}
```

An older specification uses `payment_method_id` and `idempotency_key`;
do not treat that older shape as the current validator contract.

Conceptual success:

``` json
{
  "status": "processing",
  "data": {
    "transaction_id": "uuid",
    "amount": 500000,
    "status": "pending",
    "reference_number": "TOP-20240115-ABC123",
    "redirect_url": "https://payment-gateway.example/pay/abc123",
    "expires_at": "2024-01-15T11:30:00Z"
  }
}
```

Observed validation problem in the current backend:

``` text
invalid paymentMethod
expected qris | gopay | bank_transfer | shopeepay
```

The current error handler returned HTTP `500` for that Zod error. Client
validation should ultimately map to `400`.

------------------------------------------------------------------------

# 4. Transactions

## GET /api/v1/transactions

**Status: CONFIRMED CURRENT ROUTE.**

Example:

``` http
GET /api/v1/transactions?page=1&limit=10
```

Current service response:

``` json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

Current filters:

``` text
page
limit
status
type
```

Transaction types:

``` text
TRANSFER
TOPUP
WITHDRAWAL
REFUND
```

Transaction statuses:

``` text
CREATED
PENDING
PROCESSING
SUCCESS
FAILED
CANCELLED
REVERSED
```

### Search extension

The transaction repository is being extended to search:

``` text
description
referenceNumber
sender firstName
sender lastName
receiver firstName
receiver lastName
```

Example:

``` http
GET /api/v1/transactions?page=1&limit=10&search=lunch
```

The search must be combined with the authenticated user’s wallet
condition.

## GET /api/v1/transactions/:id

**Status: CONFIRMED CURRENT ROUTE.**

The service verifies:

``` text
transaction.fromWalletId === authenticated wallet.id
OR
transaction.toWalletId === authenticated wallet.id
```

Otherwise it returns `403`.

Errors: `404` transaction/wallet not found, `403` transaction does not
belong to the user.

## POST /api/v1/transactions/transfer

**Status: CONFIRMED CURRENT ROUTE.**

Required header:

``` http
Idempotency-Key: unique-key
```

Current DTO uses the receiver wallet:

``` json
{
  "toWalletId": "receiver-wallet-uuid",
  "amount": 100000,
  "description": "Payment for lunch"
}
```

The current service validates:

``` text
idempotency
reference number
sender wallet
receiver wallet
self-transfer
amount > 0
sender/receiver frozen state
sufficient balance including fee
daily transfer limit
fraud validation
optimistic locking
```

Financial transaction uses Prisma `Serializable` isolation.

Lifecycle:

``` text
CREATED
  ↓
PROCESSING
  ↓
SUCCESS
```

Ledger:

``` text
sender   → DEBIT
receiver → CREDIT
```

Known current business errors include:

``` text
400 INVALID_AMOUNT
400 INSUFFICIENT_BALANCE
400 INVALID_TRANSFER
403 WALLET_FROZEN
404 Wallet not found
404 Destination wallet not found
409 Duplicate Transaction
409 OPTIMISTIC_LOCKING_FAILURE
409 OPTIMISTIC_LOCK_FAILED
```

The transfer service also invalidates wallet balance cache and creates
transfer notifications.

## POST /api/v1/transactions/:transaction_id/cancel

**Status:** SPECIFICATION / NOT CONFIRMED CURRENT ROUTE.

Only pending transactions can be cancelled according to the
specification.

------------------------------------------------------------------------

# 5. KYC

## POST /api/v1/kyc/submit

**Status:** SPECIFICATION / NOT CONFIRMED CURRENT ROUTE.\*\*

Content type:

``` text
multipart/form-data
```

Fields:

``` text
document_type
document_number
document_expiry
document_image
selfie_image
country_code
```

Specification describes JPEG/PNG files, maximum 10 MB each, and
face/liveness validation.

Success `202`:

``` json
{
  "status": "processing",
  "data": {
    "submission_id": "uuid",
    "kyc_status": "pending",
    "message": "Documents submitted for verification"
  }
}
```

## GET /api/v1/kyc/status

**Status:** SPECIFICATION / NOT CONFIRMED CURRENT ROUTE.

Current Prisma KYC status enum:

``` text
PENDING
VERIFIED
REJECTED
```

Current KYC tier enum:

``` text
BASIC
VERIFIED
PREMIUM
```

------------------------------------------------------------------------

# 6. Notifications

Notification functionality is **confirmed internally** in the transfer
service.

Current transfer events create:

``` text
TRANSFER_SUCCESS
TRANSFER_RECEIVED
```

Sender notification example:

``` json
{
  "type": "TRANSFER_SUCCESS",
  "channel": "IN_APP",
  "title": "Transfer Berhasil",
  "message": "Transfer sebesar 100000 berhasil."
}
```

Receiver notification example:

``` json
{
  "type": "TRANSFER_RECEIVED",
  "channel": "IN_APP",
  "title": "Transfer Masuk",
  "message": "Anda menerima transfer sebesar 100000."
}
```

A public notification router was not verified in the retrieved source,
so no specific notification URL is presented as implemented.

------------------------------------------------------------------------

# 7. Dashboard

## GET /api/v1/dashboard

**Status: CONFIRMED AS CURRENT FRONTEND API CONTRACT.**

Authenticated dashboard data covers:

``` text
wallet balance
account status
verification/KYC state
monthly top-up
monthly transfer
monthly withdrawal
transfer limits
recent transactions
cash flow when available
```

The frontend contract requires real API data and forbids hardcoded
financial values.

## GET /api/v1/dashboard/cash-flow?period=7D

**Status:** REFERENCED BY CURRENT FRONTEND CONTRACT; BACKEND ROUTE
EXISTENCE NOT CONCLUSIVELY VERIFIED.

Supported frontend periods:

``` text
7D
30D
3M
```

Conceptual response:

``` json
{
  "period": "7D",
  "currency": "IDR",
  "data": [
    {
      "date": "2026-09-09",
      "inflow": "500000.00",
      "outflow": "100000.00",
      "net": "400000.00"
    }
  ]
}
```

If the endpoint is absent, the frontend should display an explicit
unavailable state instead of fake chart data.

------------------------------------------------------------------------

# 8. Fraud and Admin

## Fraud

Internal fraud validation is confirmed because `TransactionService`
calls:

``` text
fraudService.validateTransfer(...)
```

A public fraud API was not verified.

## Admin

Specification targets:

``` http
GET /api/v1/admin/dashboard
GET /api/v1/admin/transactions
POST /api/v1/admin/user/:id/actions
```

**Status:** SPECIFICATION / NOT CONFIRMED CURRENT ROUTES.

------------------------------------------------------------------------

# 9. Operations

Specification targets:

``` http
GET /health
GET /metrics
GET /logs
```

**Status:** NOT CONFIRMED AS CURRENT ROUTES.

Observability components currently present include request IDs,
BusinessLogger, OpenTelemetry tracing, database query logging, and
transfer metrics.

------------------------------------------------------------------------

# 10. End-to-End User Flow

``` text
REGISTER
   ↓
VERIFY EMAIL
   ↓
LOGIN
   ↓
GET DASHBOARD
   ↓
GET WALLET BALANCE
   ↓
TOP UP
   ↓
GET BALANCE
   ↓
TRANSFER
   ↓
GET TRANSACTION HISTORY
   ↓
GET TRANSACTION DETAIL
   ↓
NOTIFICATION
   ↓
WITHDRAW
   ↓
KYC (when required)
   ↓
LOGOUT
```

Transfer critical path:

``` text
HTTP request
   ↓
auth middleware
   ↓
Zod validation
   ↓
controller
   ↓
transaction service
   ↓
idempotency check
   ↓
wallet validation
   ↓
amount + limit validation
   ↓
fraud validation
   ↓
Serializable DB transaction
   ↓
transaction CREATED
   ↓
transaction PROCESSING
   ↓
sender debit
   ↓
receiver credit
   ↓
ledger entries
   ↓
transaction log
   ↓
transaction SUCCESS
   ↓
cache invalidation
   ↓
notifications
   ↓
HTTP response
```

------------------------------------------------------------------------

# 11. Data Integrity Model

The Prisma schema establishes:

``` text
Wallet.balance
```

as a cached/reconcilable balance, while:

``` text
LedgerEntry
```

is the accounting source of truth.

Transaction records reference wallets rather than users.

Wallet updates use a version field for optimistic locking.

Transaction records contain a unique idempotency key.

Ledger entries are append-only.

Transaction logs are append-only status history.

------------------------------------------------------------------------

# 12. Redis Responsibilities

The project specification uses Redis for:

``` text
sessions
balance cache
limits cache
OTP
email verification
password reset
idempotency
rate limiting
fraud velocity
user profile
KYC
transaction history
wallet locks
```

Specified TTLs include:

``` text
session: 24h
balance cache: 30s
OTP: 10m
rate limit: 1h
idempotency: 24h
user profile: 5m
```

Current backend repeatedly warns:

``` text
Eviction policy is allkeys-lru. It should be noeviction
```

This should be resolved before production because
session/idempotency/OTP state is operationally important.

------------------------------------------------------------------------

# 13. Pagination Contract

Current request:

``` http
GET /api/v1/transactions?page=1&limit=10
```

Transport query parameters arrive from Express as strings.

Correct architecture:

``` text
"1" / "10"
   ↓
Zod coercion
   ↓
1 / 10
   ↓
typed DTO
   ↓
service
   ↓
repository
   ↓
Prisma skip/take
```

The repository should receive numbers, not perform HTTP parsing itself.

------------------------------------------------------------------------

# 14. Testing Checklist

## Auth

``` text
[ ] register success
[ ] duplicate email
[ ] duplicate phone
[ ] email verification
[ ] expired verification token
[ ] login success
[ ] invalid credentials
[ ] refresh
[ ] logout
[ ] 2FA
[ ] password reset
```

## Wallet

``` text
[ ] balance
[ ] frozen wallet
[ ] wallet not found
[ ] cache hit
[ ] cache invalidation
```

## Payment

``` text
[ ] QRIS
[ ] Gopay
[ ] bank_transfer
[ ] ShopeePay
[ ] invalid paymentMethod
[ ] invalid amount
[ ] reconciliation
```

## Transfer

``` text
[ ] success
[ ] invalid amount
[ ] insufficient balance
[ ] recipient missing
[ ] self transfer
[ ] frozen sender
[ ] frozen receiver
[ ] daily limit
[ ] fraud block
[ ] duplicate idempotency
[ ] optimistic locking conflict
[ ] ledger rollback
[ ] notification
[ ] cache invalidation
```

## Transactions

``` text
[ ] page
[ ] limit
[ ] status filter
[ ] type filter
[ ] description search
[ ] reference search
[ ] sender-name search
[ ] receiver-name search
[ ] empty state
[ ] detail
[ ] unauthorized detail
```

------------------------------------------------------------------------

# 15. Endpoint Inventory

| Endpoint                                           | Current status                                                 |
|----------------------------------------------------|----------------------------------------------------------------|
| `POST /api/v1/auth/login`                          | Confirmed                                                      |
| `GET /api/v1/transactions`                         | Confirmed                                                      |
| `GET /api/v1/transactions/:id`                     | Confirmed                                                      |
| `POST /api/v1/transactions/transfer`               | Confirmed                                                      |
| `POST /api/v1/payment/topup`                       | Confirmed                                                      |
| `GET /api/v1/dashboard`                            | Confirmed by frontend contract                                 |
| `GET /api/v1/wallet/balance`                       | Wallet functionality confirmed; route source not retrieved     |
| `POST /api/v1/auth/register`                       | Specification                                                  |
| `POST /api/v1/auth/verify-email`                   | Specification                                                  |
| `POST /api/v1/auth/refresh-token`                  | Specification                                                  |
| `POST /api/v1/auth/logout`                         | Specification                                                  |
| `POST /api/v1/auth/enable-2fa`                     | Specification / parked                                         |
| `POST /api/v1/auth/verify-2fa`                     | Specification / parked                                         |
| `POST /api/v1/auth/request-password-reset`         | Specification                                                  |
| `POST /api/v1/auth/reset-password`                 | Specification                                                  |
| `GET /api/v1/wallet/transactionsSummary`           | Specification                                                  |
| `POST /api/v1/wallet/withdrawal`                   | Specification                                                  |
| `POST /api/v1/transactions/:transaction_id/cancel` | Specification                                                  |
| `POST /api/v1/kyc/submit`                          | Specification                                                  |
| `GET /api/v1/kyc/status`                           | Specification                                                  |
| Public notification routes                         | Not verified                                                   |
| Public fraud routes                                | Not verified                                                   |
| Admin routes                                       | Specification                                                  |
| `GET /api/v1/dashboard/cash-flow`                  | Frontend contract; backend existence not conclusively verified |
| `/health`                                          | Specification                                                  |
| `/metrics`                                         | Specification                                                  |

------------------------------------------------------------------------

# 16. Documentation Rule

When a route in this document conflicts with the current code:

``` text
current route/controller/validator
        >
current service
        >
current Prisma schema
        >
observed Postman/log response
        >
frontend API contract
        >
historical specification
```

This rule prevents the API documentation from silently turning planned
features into fake implemented endpoints.
