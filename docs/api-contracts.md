# Fintech API Contracts

## 1. Document Purpose

This document defines the API conventions and response contracts
for the fintech digital wallet backend.

The existing implementation is the source of truth.

Before changing an endpoint, inspect:

- Existing routes
- Controllers
- Services
- Repositories
- DTOs
- Validators
- Middleware
- Response wrappers
- Error handlers
- Prisma schema
- Existing tests

Do not introduce a new API convention if the project already
has an established one.

---

# 2. API Base Configuration

## 2.1 Base URL

Local development:

http://localhost:3000/api/v1

The actual port and API prefix must follow the project configuration.

---

## 2.2 Authentication

Protected endpoints require authentication through the
existing JWT authentication mechanism.

Example:

Authorization: Bearer <access_token>

The authenticated user ID must be extracted from the validated
authentication context.

Do not trust userId values from the request body or query
for authorization.

---

## 2.3 Content Type

Requests containing JSON data should use:

Content-Type: application/json

File upload endpoints must use the appropriate multipart
content type according to the existing implementation.

---

## 2.4 API Versioning

The current API version is:

v1

Existing versioning conventions must be preserved.

---

# 3. Standard Response Format

## 3.1 Success Response

The project currently uses a success response similar to:

{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}

The actual response wrapper must follow the existing implementation.

---

## 3.2 Error Response

The project should use a consistent error response.

Example:

{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "amount",
      "message": "Amount must be greater than zero"
    }
  ]
}

The actual error structure must follow the existing
centralized error handler.

Do not create a second incompatible error format.

---

## 3.3 Response Data Rules

API responses must:

- Return only fields required by the client.
- Exclude sensitive internal fields.
- Use consistent naming conventions.
- Use consistent date serialization.
- Use consistent Decimal serialization.
- Use consistent enum values.
- Avoid exposing database implementation details.

---

# 4. HTTP Status Codes

Use the existing project conventions.

Common status codes:

## 200 OK

The request succeeded.

Used for successful read operations and successful updates
where appropriate.

---

## 201 Created

A new resource was successfully created.

Examples:

- New payment
- New withdrawal request
- New KYC request

---

## 400 Bad Request

The request is malformed or violates request validation.

Examples:

- Invalid amount
- Invalid query parameter
- Invalid date range
- Invalid enum value

---

## 401 Unauthorized

Authentication is missing, invalid, or expired.

---

## 403 Forbidden

The user is authenticated but is not allowed to perform
the requested operation.

Examples:

- Inactive account
- Insufficient permissions
- Restricted financial operation

---

## 404 Not Found

The requested resource does not exist or is not accessible
under the applicable resource visibility policy.

---

## 409 Conflict

The request conflicts with the current state.

Examples:

- Duplicate idempotency key
- Conflicting transaction state
- Concurrent financial operation
- Duplicate resource

---

## 422 Unprocessable Entity

Use only if this status is already part of the project's
established validation convention.

---

## 429 Too Many Requests

Rate limit exceeded.

Use only where rate limiting is implemented.

---

## 500 Internal Server Error

Unexpected server error.

Internal implementation details must not be exposed to clients.

---

# 5. Authentication API

The exact authentication routes must follow the existing
implementation.

Potential endpoints:

- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- POST /auth/verify-email
- POST /auth/resend-verification
- POST /auth/forgot-password
- POST /auth/reset-password

Before documenting or modifying these endpoints, inspect
the actual route definitions.

---

# 6. User Profile API

## 6.1 Get Current User Profile

Potential endpoint:

GET /users/me

Authentication:

Required

Purpose:

Return safe profile information for the authenticated user.

The response must not expose:

- passwordHash
- emailVerificationToken
- OTP values
- KYC document paths
- Internal security fields

Example:

{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "phoneNumber": "08xxxxxxxxxx",
    "firstName": "Rizq",
    "lastName": "Valeant",
    "role": "USER",
    "kycStatus": "PENDING",
    "kycTier": "BASIC",
    "isActive": true,
    "isEmailVerified": false,
    "createdAt": "2026-09-15T09:00:00.000Z"
  }
}

This is an example contract.

The actual endpoint and response must follow the existing
implementation.

---

# 7. Dashboard API

## 7.1 Get Dashboard

Endpoint:

GET /dashboard

Full local URL:

http://localhost:3000/api/v1/dashboard

Authentication:

Required

Purpose:

Return a financial overview for the authenticated user.

The endpoint is read-only.

It must not:

- Debit wallet balance
- Credit wallet balance
- Create payments
- Create withdrawals
- Change transaction status
- Change KYC status
- Reset limits
- Create ledger records

---

## 7.2 Query Parameters

Optional query parameter:

period

Supported values:

- 7D
- 30D
- 3M

Example:

GET /dashboard?period=30D

Purpose:

Determine the cash flow analytics period.

If the parameter is omitted, use the existing dashboard default.

Invalid values must be handled according to the existing
validation and error conventions.

---

## 7.3 Dashboard Response

Target response structure:

{
  "success": true,
  "message": "Dashboard fetched successfully",
  "data": {
    "user": {
      "id": "user-id",
      "firstName": "Rizq",
      "lastName": "Valeant",
      "email": "user@example.com"
    },
    "wallet": {
      "balance": "1670000.00",
      "currency": "IDR",
      "isFrozen": false,
      "walletStatus": "ACTIVE"
    },
    "accountOverview": {
      "isActive": true,
      "isEmailVerified": false,
      "kyc": {
        "status": "PENDING",
        "tier": "BASIC"
      },
      "actions": {
        "canTopUp": true,
        "canTransfer": false,
        "canWithdraw": false
      }
    },
    "monthlyStatistics": {
      "period": {
        "type": "MONTH",
        "startDate": "2026-09-01T00:00:00.000Z",
        "endDate": "2026-10-01T00:00:00.000Z"
      },
      "totalTopUp": "2500000.00",
      "totalTransfer": "1200000.00",
      "totalWithdrawal": "500000.00"
    },
    "cashFlow": {
      "period": "7D",
      "income": "2500000.00",
      "expense": "1200000.00",
      "net": "1300000.00",
      "currency": "IDR",
      "series": [
        {
          "date": "2026-09-15",
          "income": "500000.00",
          "expense": "100000.00",
          "net": "400000.00"
        }
      ]
    },
    "limits": {
      "dailyTransfer": {
        "limit": "10000000.00",
        "used": "0.00",
        "remaining": "10000000.00",
        "percentageUsed": 0
      },
      "monthlyTransfer": {
        "limit": "50000000.00",
        "used": "0.00",
        "remaining": "50000000.00",
        "percentageUsed": 0
      }
    },
    "recentTransactions": [],
    "pendingActivities": []
  }
}

This is a target contract.

Before implementation, verify that every field is supported
by the actual schema and existing business logic.

Do not fabricate financial data.

---

## 7.4 Dashboard User Data

The user section may include:

- id
- firstName
- lastName
- email

Do not expose sensitive account fields.

---

## 7.5 Dashboard Wallet Data

The wallet section may include:

- balance
- currency
- isFrozen
- walletStatus

Do not expose internal version fields unless required.

The balance must be serialized according to the existing
Decimal convention.

---

## 7.6 Dashboard Account Overview

The account overview may include:

- isActive
- isEmailVerified
- KYC status
- KYC tier
- Wallet status
- Action eligibility

Action eligibility must be based on actual business rules.

Do not invent restrictions.

If eligibility rules are not implemented, return only the
available status information or clearly document the assumption.

---

## 7.7 Monthly Statistics

The monthly statistics may include:

- totalTopUp
- totalTransfer
- totalWithdrawal

Rules:

- Use the current calendar month.
- Follow the configured timezone.
- Count only applicable financial states.
- Avoid duplicate counting.
- Preserve monetary precision.

The authoritative data source for each metric must be verified
before implementation.

---

## 7.8 Cash Flow Analytics

The cash flow section may include:

- period
- income
- expense
- net
- currency
- series

Each series item may include:

- date
- income
- expense
- net

Rules:

- Include every date in the requested period.
- Include zero-value days.
- Use consistent date formatting.
- Use the correct financial classification.
- Do not double-count ledger records.
- Scope all data to the authenticated user.

---

## 7.9 Transfer Limits

The limits section may include:

- dailyTransfer
- monthlyTransfer

Each limit object may include:

- limit
- used
- remaining
- percentageUsed

Rules:

- Read the actual limit data.
- Do not hardcode values.
- Do not mutate limits.
- Avoid division by zero.
- Preserve monetary precision.

---

## 7.10 Recent Transactions

The dashboard may return the latest five transactions.

Each transaction may include:

- id
- type
- description
- amount
- currency
- direction
- status
- reference
- createdAt

Rules:

- Only return transactions belonging to the authenticated user.
- Sort by newest first.
- Do not expose sensitive fields.
- Do not expose another user's private information.
- Use actual status values.
- Avoid duplicate records.

---

## 7.11 Pending Activities

Pending activities may include:

- Pending top-up
- Pending transfer
- Pending withdrawal

Each activity may include:

- id
- type
- description
- amount
- currency
- status
- createdAt

Rules:

- Only include actual pending or processing states.
- Do not include completed or failed operations.
- Do not expose sensitive provider information.
- Avoid duplicate activities.

---

# 8. Wallet API

Potential endpoints:

- GET /wallet
- GET /wallet/balance
- GET /wallet/transactions

The actual routes must follow the existing implementation.

Wallet endpoints must:

- Require authentication.
- Scope access to the authenticated user.
- Preserve monetary precision.
- Avoid exposing internal wallet fields.
- Never allow unauthorized balance modification.

---

# 9. Top-Up API

Potential endpoints:

- POST /payments/top-up
- GET /payments/:id
- POST /payments/webhook

The actual routes must be inspected before implementation.

## Top-Up Request Example

{
  "amount": "500000.00",
  "paymentMethod": "BANK_TRANSFER"
}

This is an example only.

The actual request fields and payment methods must follow
the existing schema and validation rules.

---

## Top-Up Requirements

- Validate amount.
- Validate payment method.
- Authenticate the user where applicable.
- Create the appropriate payment record.
- Use provider verification.
- Apply idempotency.
- Credit wallet only after successful verification.
- Record the financial event.
- Return a safe payment response.

---

## Webhook Requirements

Provider webhooks must:

- Verify signatures.
- Validate event data.
- Handle duplicate events.
- Validate payment state transitions.
- Apply wallet updates atomically.
- Return the provider-compatible response.
- Avoid exposing internal errors unnecessarily.

---

# 10. Transfer API

Potential endpoint:

POST /transfers

Authentication:

Required

Purpose:

Transfer funds between eligible wallets.

Example request:

{
  "recipientId": "recipient-user-id",
  "amount": "100000.00",
  "description": "Transfer"
}

This is a target example.

The actual request contract must follow the existing
transfer implementation.

---

## Transfer Requirements

- Validate recipient.
- Validate amount.
- Check sender wallet.
- Check balance.
- Check applicable limits.
- Check KYC restrictions.
- Check account and wallet status.
- Apply fraud or risk rules.
- Apply idempotency.
- Execute the financial operation atomically.
- Record the financial event.
- Return the resulting transaction safely.

---

# 11. Withdrawal API

Potential endpoints:

- POST /withdrawals
- GET /withdrawals
- GET /withdrawals/:id

Authentication:

Required

Purpose:

Request a withdrawal from the wallet to an eligible
external destination.

Example request:

{
  "amount": "500000.00",
  "destinationId": "bank-account-id"
}

This is a target example.

The actual request contract must follow the existing
withdrawal implementation.

---

## Withdrawal Requirements

- Validate amount.
- Validate destination.
- Check balance.
- Check limits.
- Check KYC requirements.
- Check account and wallet status.
- Apply applicable fees.
- Apply idempotency.
- Create withdrawal request.
- Follow settlement lifecycle.
- Handle success and failure safely.
- Return a safe withdrawal response.

---

# 12. Transaction History API

Potential endpoint:

GET /transactions

Authentication:

Required

Purpose:

Return the authenticated user's transaction history.

Potential query parameters:

- page
- limit
- type
- status
- startDate
- endDate
- search

Example:

GET /transactions?page=1&limit=20&status=SUCCESS

The actual supported filters must follow the existing
transaction implementation.

---

## Transaction Response Example

{
  "success": true,
  "message": "Transactions fetched successfully",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 0,
      "totalPages": 0
    }
  }
}

The existing pagination convention must be preserved.

---

# 13. Transaction Detail API

Potential endpoint:

GET /transactions/:id

Authentication:

Required

Purpose:

Return details of a transaction visible to the authenticated user.

The response may include:

- id
- type
- status
- amount
- currency
- fee
- total
- reference
- description
- createdAt
- completedAt

Do not expose:

- Internal credentials
- Another user's private data
- Sensitive provider secrets
- Internal fraud details
- Unnecessary database fields

The actual response must follow the transaction domain.

---

# 14. KYC API

Potential endpoints:

- POST /kyc/requests
- GET /kyc/status
- GET /kyc/requests/:id
- POST /kyc/requests/:id/documents

The actual routes must follow the existing implementation.

KYC endpoints must:

- Require authentication.
- Validate uploaded files.
- Protect identity documents.
- Avoid exposing document storage paths.
- Apply the KYC workflow.
- Preserve auditability.
- Prevent unauthorized status changes.

---

# 15. Notification API

Potential endpoints:

- GET /notifications
- PATCH /notifications/:id/read
- PATCH /notifications/read-all

The actual routes must follow the existing implementation.

Notifications must be scoped to the authenticated user.

---

# 16. Security API

Potential endpoints:

- GET /sessions
- DELETE /sessions/:id
- GET /devices
- DELETE /devices/:id
- POST /security/change-password
- POST /security/2fa/enable
- POST /security/2fa/disable

The actual routes and security mechanisms must follow
the existing implementation.

---

# 17. Pagination Rules

Where pagination is supported:

- Validate page.
- Validate limit.
- Apply maximum limit.
- Use deterministic ordering.
- Avoid duplicate records across pages.
- Return the existing pagination structure.
- Scope all records to the authenticated user.

The exact pagination strategy must follow the existing project.

---

# 18. Date and Time Rules

All API date values should use the existing project convention.

ISO 8601 UTC is recommended for timestamps, for example:

2026-09-15T09:31:00.000Z

Date-only values, such as cash flow series dates, should
follow a consistent format.

Timezone-sensitive calculations must use the configured
application or business timezone.

Do not silently use the frontend's local timezone for
financial calculations.

---

# 19. Monetary Serialization Rules

Monetary values must preserve precision.

The API may serialize monetary values as strings:

{
  "amount": "100000.00",
  "currency": "IDR"
}

The actual serialization convention must follow the existing
project.

Do not convert precise financial values to floating-point
numbers merely for convenience.

---

# 20. Idempotency API Rules

Financial mutation endpoints should support an approved
idempotency strategy where required.

Potential header:

Idempotency-Key: unique-request-key

The exact header name, storage strategy, and behavior must
follow the existing implementation.

Repeated requests with the same valid idempotency key must
not produce duplicate financial effects.

---

# 21. Validation Rules

Validate:

- Request body
- Query parameters
- URL parameters
- Authentication context
- Amounts
- Enums
- Dates
- Pagination
- File uploads
- Ownership
- Business constraints

Use the existing validation library and conventions.

Do not duplicate validation rules inconsistently across
controllers and services.

---

# 22. Authorization Rules

Every protected endpoint must:

- Authenticate the user.
- Resolve the authenticated user ID.
- Enforce ownership.
- Enforce role restrictions where applicable.
- Prevent IDOR vulnerabilities.
- Avoid accepting client-controlled ownership fields.

Admin-only endpoints must follow the existing role system.

---

# 23. API Contract Change Rules

Before changing an existing endpoint:

1. Inspect current behavior.
2. Inspect frontend consumers if available.
3. Inspect tests.
4. Identify breaking changes.
5. Preserve backward compatibility where practical.
6. Update relevant documentation.
7. Update tests.
8. Clearly report changed response fields.

Do not silently remove existing response fields.

---

# 24. Dashboard Acceptance Criteria

The dashboard endpoint is considered complete when:

- It requires authentication.
- It returns only the authenticated user's data.
- It returns safe user information.
- It returns the authoritative wallet balance.
- It returns wallet currency and status.
- It returns account verification information.
- It returns monthly financial statistics.
- It returns cash flow analytics.
- It returns daily and monthly limits.
- It returns recent transactions.
- It returns pending activities where supported.
- It preserves monetary precision.
- It does not expose sensitive fields.
- It does not mutate financial state.
- It handles empty data correctly.
- It handles invalid query parameters correctly.
- It follows the existing response wrapper.
- It follows the existing error-handling conventions.
- It avoids N+1 queries.
- It has appropriate automated tests.

---

# 25. Contract Limitations

The response structures in this document are target examples.

They are not permission to invent:

- Database models
- Transaction statuses
- Business rules
- Financial calculations
- KYC permissions
- Fees
- Limits
- Payment methods
- Provider integrations

The actual Prisma schema, existing domain logic, and approved
business requirements must take precedence.