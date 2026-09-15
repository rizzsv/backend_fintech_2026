# Fintech Business Rules

## 1. Document Purpose

This document defines the business rules for the fintech digital wallet system.

The system provides financial services such as:

- User authentication
- Email verification
- KYC verification
- Digital wallet management
- Wallet top-up
- Wallet-to-wallet transfer
- Bank withdrawal
- Payment processing
- Transaction ledger
- User transaction limits
- Notifications
- Fraud detection
- Refund and reversal

This document serves as a business reference for backend development.

All implementation must follow the actual database schema,
existing domain logic, and approved business requirements.

If a rule is not explicitly defined, do not invent a financial rule.
Mark it as TBD and request clarification.

---

# 2. General Principles

## 2.1 User Data Isolation

Every authenticated user must only access their own private data.

Private data includes:

- User profile
- Wallet
- Wallet balance
- Payments
- Transactions
- Withdrawals
- KYC submissions
- Notifications
- Sessions
- Devices
- User limits

The authenticated user ID must come from the validated JWT.

Do not trust userId values from:

- Request body
- Query parameters
- URL parameters

when determining ownership or authorization.

---

## 2.2 Financial Data Integrity

Financial operations must preserve:

- Accurate balances
- Transaction consistency
- Ledger integrity
- Idempotency
- Atomicity
- Auditability
- Correct transaction status
- Monetary precision

Financial operations must not rely on JavaScript floating-point
arithmetic for monetary calculations.

Use the existing Decimal implementation or another
precision-safe monetary representation.

---

## 2.3 Read-Only Endpoints

Read-only endpoints, including the dashboard endpoint,
must not mutate financial state.

The dashboard must not:

- Debit a wallet
- Credit a wallet
- Create a payment
- Create a withdrawal
- Change KYC status
- Reset transaction limits
- Change transaction status
- Create ledger entries

If data requires a state transition, that transition must happen
through the appropriate domain use case.

---

# 3. User Account Rules

## 3.1 User Identity

The User entity contains information such as:

- id
- email
- phoneNumber
- passwordHash
- firstName
- lastName
- role
- kycStatus
- kycTier
- isActive
- deletedAt
- isEmailVerified

The actual Prisma schema is the source of truth.

---

## 3.2 Account Status

A user account may have the following relevant states:

- Active
- Inactive
- Soft deleted

The exact enum or state representation must follow the existing schema.

Business expectations:

- Inactive users must not perform restricted financial operations.
- Soft-deleted users must not access normal authenticated
  financial operations.
- Existing sessions must be handled according to the
  application's authentication policy.
- Account status must be checked by protected financial operations.

Do not implement account restrictions solely in the dashboard.

---

## 3.3 Email Verification

Email verification is required according to the existing
authentication and security policy.

The system may contain:

- Email verification token
- Email verification expiration
- Email verification status

Rules:

- Verification tokens must never be exposed through API responses.
- Expired tokens must not be accepted.
- Verification tokens must not be stored or compared insecurely.
- The dashboard may display whether the email is verified.
- The dashboard must not verify an email automatically.

The exact transaction restrictions for unverified emails are TBD
unless already defined in the authentication or financial domain.

---

# 4. KYC Rules

## 4.1 KYC Purpose

KYC is used to verify the identity of a user and determine
which financial services or limits the user may access.

The system contains fields similar to:

- kycStatus
- kycTier
- kycDocumentPath
- kycSelfiePath

It may also contain a separate KycRequest entity.

The actual schema and KYC workflow are authoritative.

---

## 4.2 KYC Status

The current KYC status must be read from the existing enum.

Potential states may include:

- PENDING
- IN_REVIEW
- APPROVED
- REJECTED

Do not add or assume enum values without inspecting the schema.

---

## 4.3 KYC Tier

The current KYC tier must be read from the existing enum.

The system currently uses a BASIC tier.

Additional tiers and their permissions must be explicitly defined
before implementation.

---

## 4.4 KYC Submission

KYC submission may require:

- Identity document
- Selfie
- User identity information
- Additional verification data

Rules:

- KYC documents must be stored securely.
- KYC document paths must not be exposed in normal user APIs.
- KYC status must only be changed through the KYC workflow.
- A dashboard request must never approve or reject KYC.
- KYC review actions must be auditable.

---

## 4.5 KYC and Financial Limits

KYC tier may affect:

- Daily transaction limits
- Monthly transaction limits
- Available financial features
- Withdrawal eligibility
- Transfer eligibility

The exact mapping between KYC tier and financial limits is TBD
unless already implemented in the domain.

Do not hardcode KYC-based restrictions in the dashboard.

---

# 5. Wallet Rules

## 5.1 Wallet Ownership

Each wallet belongs to a specific user.

A user must only be able to access their own wallet.

The wallet owner must be determined from the authenticated user
and database relationships.

---

## 5.2 Wallet Balance

The Wallet entity contains a balance and currency.

Example:

- Currency: IDR
- Balance: Decimal value

Rules:

- The wallet balance is the authoritative available balance
  according to the existing wallet design.
- Do not calculate the current balance by summing dashboard
  transactions if the Wallet model already stores the balance.
- Do not use floating-point arithmetic for money.
- Do not expose internal optimistic-locking fields unless required.
- Wallet balance changes must happen through financial use cases.
- Every applicable balance change must have an auditable record.

---

## 5.3 Wallet Currency

The current wallet currency is expected to be IDR.

Rules:

- All monetary calculations must respect the wallet currency.
- Currency must be returned explicitly in financial responses.
- Cross-currency operations are not supported unless explicitly
  implemented.
- Do not silently convert currencies.

---

## 5.4 Frozen Wallet

The wallet may have a frozen state.

When a wallet is frozen:

- Financial operations must follow the wallet restriction policy.
- New outgoing transactions may be blocked.
- Existing pending transactions must be handled according to
  their own lifecycle.
- The wallet must not be unfrozen by a dashboard request.

The exact behavior for each financial operation is TBD if not
already defined in the domain.

---

# 6. Monetary Rules

## 6.1 Precision

All financial amounts must preserve exact monetary precision.

Use:

- Prisma Decimal
- Decimal arithmetic
- String serialization for API monetary values, if that is
  the existing project convention

Avoid:

- JavaScript Number for financial calculations
- Floating-point addition
- Floating-point subtraction
- Floating-point comparisons

---

## 6.2 Amount Validation

Every financial amount must be validated before processing.

Validation should consider:

- Required amount
- Positive amount
- Minimum amount
- Maximum amount
- Currency
- User limits
- Wallet balance
- Applicable fees

Minimum and maximum amounts are TBD unless defined by the
existing financial domain.

---

## 6.3 Zero and Negative Amounts

Financial operations must reject:

- Zero-value operations
- Negative amounts
- Invalid decimal values
- NaN
- Infinity
- Malformed monetary values

The exact error format must follow the existing API conventions.

---

# 7. Payment and Top-Up Rules

## 7.1 Top-Up Purpose

Top-up adds funds to a user's wallet through an approved
payment method or payment provider.

The existing Payment model and payment workflow are authoritative.

---

## 7.2 Top-Up Lifecycle

A typical top-up lifecycle may include:

1. Payment initiated
2. Payment pending
3. Payment provider processing
4. Payment verification
5. Payment successful or failed
6. Wallet credited after successful verification
7. Ledger entry created
8. Notification generated

The actual status enum and lifecycle must follow the existing
implementation.

---

## 7.3 Payment Verification

For payment-provider callbacks:

- Verify the provider signature.
- Validate the payment reference.
- Validate the payment amount.
- Validate the payment status.
- Ensure the payment belongs to the expected user or wallet.
- Apply idempotency protection.
- Update payment and wallet state atomically.
- Create the appropriate ledger record.
- Record relevant audit information.

Never credit a wallet solely because a client claims that
a payment was successful.

---

## 7.4 Top-Up Idempotency

A payment callback may be delivered more than once.

The system must not credit the wallet multiple times for the
same successful payment.

The existing payment reference, provider transaction ID,
or another approved idempotency mechanism must be used.

The exact idempotency key and uniqueness constraints must follow
the existing schema.

---

## 7.5 Failed or Cancelled Top-Ups

Failed, expired, or cancelled payments must not credit the wallet.

If a previously successful top-up needs to be reversed,
the reversal must follow the approved refund or reversal workflow.

---

# 8. Wallet Transfer Rules

## 8.1 Transfer Purpose

A transfer moves funds from one wallet to another wallet.

The sender and recipient must be resolved using the existing
user and wallet domain.

---

## 8.2 Transfer Preconditions

Before a transfer is executed, the system should validate:

- Sender exists.
- Recipient exists.
- Sender is authorized.
- Sender is active.
- Sender wallet exists.
- Recipient wallet exists.
- Sender wallet is not restricted.
- Recipient wallet is eligible to receive funds.
- Amount is valid and positive.
- Sender has sufficient available balance.
- Daily limit is not exceeded.
- Monthly limit is not exceeded.
- Applicable KYC restrictions are satisfied.
- Applicable fraud or risk checks are satisfied.

The exact preconditions must follow the existing domain rules.

---

## 8.3 Self-Transfer

Whether users may transfer funds to their own wallet is TBD.

Do not assume that self-transfer is allowed or forbidden without
an explicit business decision.

---

## 8.4 Transfer Atomicity

A wallet-to-wallet transfer must be handled atomically.

The system must not produce a state where:

- Sender is debited but recipient is not credited.
- Recipient is credited without sender debit.
- Ledger records do not match the resulting balances.
- The transaction is marked successful without completed
  financial state changes.

Use the existing transaction manager and database transaction
strategy.

---

## 8.5 Transfer Idempotency

Repeated requests must not create duplicate transfers.

The system must use an approved idempotency mechanism.

The idempotency strategy must account for:

- Client retries
- Network timeouts
- Duplicate requests
- Concurrent requests
- Existing transaction status

---

## 8.6 Transfer Fees

Transfer fees may apply.

The fee policy is TBD unless already implemented.

If fees are supported:

- The fee must be calculated deterministically.
- The fee must be included in the correct financial records.
- The user must see the fee before confirmation when required.
- The total debit must be clear.
- Fee accounting must not be double-counted.
- Fee reversals must follow the approved reversal policy.

---

# 9. Withdrawal Rules

## 9.1 Withdrawal Purpose

Withdrawal moves funds from a user's wallet to an external bank
account or supported payout destination.

The existing Withdrawal model and settlement workflow are
authoritative.

---

## 9.2 Withdrawal Preconditions

Before withdrawal:

- User must be active.
- Wallet must exist.
- Wallet must be eligible.
- Amount must be valid.
- Balance must be sufficient.
- Daily and monthly limits must be checked.
- KYC requirements must be checked.
- Destination account must be validated.
- Applicable fees must be calculated.
- Fraud and risk checks must be performed.

The exact rules depend on the implemented withdrawal workflow.

---

## 9.3 Withdrawal Lifecycle

A typical lifecycle may include:

1. Withdrawal requested
2. Validation
3. Funds reserved or held, if supported
4. Provider settlement initiated
5. Processing
6. Successful settlement or failure
7. Final balance adjustment
8. Ledger entry
9. Notification

The actual lifecycle must follow the existing implementation.

---

## 9.4 Withdrawal Failure

If withdrawal settlement fails:

- The failure must be recorded.
- The user must not permanently lose funds due to an inconsistent
  state.
- Any reserved funds must be released according to the
  withdrawal policy.
- The transaction must not be marked successful.
- Retry behavior must follow the approved settlement policy.

---

# 10. Transaction and Ledger Rules

## 10.1 Transaction Source of Truth

The actual transaction and ledger models are the source of truth.

Before implementing dashboard aggregations, inspect:

- Transaction models
- Payment models
- WalletTransaction models
- Ledger models
- Withdrawal models
- Status enums
- Relations
- Reversal behavior

Do not assume that all financial activity exists in one table.

---

## 10.2 Transaction Status

Use the actual status enums from the schema.

Potential statuses may include:

- PENDING
- PROCESSING
- SUCCESS
- FAILED
- CANCELLED
- REVERSED

Do not introduce new statuses without updating the domain,
database, and relevant business logic.

---

## 10.3 Successful Financial Activity

Only transactions that represent completed financial operations
should be included in successful financial statistics.

Failed, cancelled, and pending operations must not be counted
as completed financial activity.

Reversed operations must follow the approved accounting policy.

---

## 10.4 Ledger Integrity

Every applicable financial balance change must have a corresponding
auditable financial record.

Ledger records must not be edited casually after posting.

Corrections should use an approved reversal or adjustment process.

The exact ledger model and accounting approach must follow the
existing implementation.

---

## 10.5 Double-Counting Prevention

A financial operation may appear in multiple related tables.

For example:

- Payment
- Transaction
- WalletTransaction
- Ledger entry

Dashboard calculations must not count the same financial event
multiple times.

Define the authoritative source for each metric before implementing
aggregation logic.

---

# 11. User Transaction Limits

## 11.1 Limit Data

The UserLimit model contains fields similar to:

- userId
- dailyLimit
- monthlyLimit
- dailyUsed
- monthlyUsed
- lastResetAt
- updatedAt

The actual Prisma schema is authoritative.

---

## 11.2 Daily Limit

Daily usage must be calculated according to the existing limit
policy and timezone.

The daily limit must not be exceeded.

The exact reset time and timezone must be explicitly defined.

---

## 11.3 Monthly Limit

Monthly usage must be calculated according to the existing limit
policy and timezone.

The monthly limit must not be exceeded.

The exact reset policy must follow the existing implementation.

---

## 11.4 Limit Calculation

For dashboard display:

remaining = max(limit - used, 0)

percentageUsed must be calculated safely.

If limit equals zero:

- Do not divide by zero.
- Follow the existing display convention.
- Do not assume that zero means unlimited.

---

## 11.5 Limit Mutation

The dashboard must never mutate:

- dailyUsed
- monthlyUsed
- dailyLimit
- monthlyLimit
- lastResetAt

Limit mutation must occur only through the appropriate
transaction or limit-management workflow.

---

# 12. Dashboard Business Rules

## 12.1 Dashboard Is Read-Only

The dashboard endpoint provides a financial overview.

It must not execute:

- Top-up
- Transfer
- Withdrawal
- Refund
- KYC submission
- KYC approval
- Limit reset
- Wallet balance mutation

---

## 12.2 Dashboard User Scope

The dashboard must only return information belonging to
the authenticated user.

---

## 12.3 Wallet Balance

The dashboard must display the authoritative wallet balance.

It must also display the wallet currency and relevant status.

---

## 12.4 Monthly Statistics

Monthly statistics must use the current calendar month
according to the configured timezone.

Potential metrics:

- Total successful top-ups
- Total successful outgoing transfers
- Total successful withdrawals

The authoritative data source for each metric must be explicitly
identified before implementation.

---

## 12.5 Cash Flow

Cash flow must classify financial activity consistently.

Potential income:

- Successful top-ups
- Incoming wallet transfers

Potential expense:

- Outgoing wallet transfers
- Successful withdrawals
- Applicable fees

The classification must not double-count financial events.

The exact classification is subject to the existing ledger
and transaction model.

---

## 12.6 Recent Transactions

Recent transactions must:

- Belong to the authenticated user.
- Be ordered newest first.
- Use the actual transaction status.
- Return safe public transaction information.
- Avoid exposing internal or sensitive fields.
- Support a reasonable default result limit.

---

## 12.7 Pending Activities

Pending activities may include:

- Pending top-ups
- Pending withdrawals
- Pending transfers

Only activities that are genuinely pending or processing
should be returned.

The exact source models and status mapping must be verified.

---

# 13. Notifications

The system may generate notifications for:

- Successful top-up
- Failed top-up
- Successful transfer
- Failed transfer
- Withdrawal status changes
- KYC status changes
- Security events
- Fraud alerts

Rules:

- Notifications must belong to the correct user.
- Sensitive information must not be exposed unnecessarily.
- Notification creation must follow the relevant domain event.
- The dashboard must not create notifications merely by being read.

---

# 14. Fraud and Risk Rules

The system may contain a FraudCase model or fraud detection
workflow.

Fraud checks may be applied to:

- Top-up
- Transfer
- Withdrawal
- Login
- Unusual transaction activity

Rules:

- Fraud checks must follow the existing risk architecture.
- Dashboard responses must not expose sensitive internal
  fraud detection details.
- Fraud decisions must be auditable.
- A dashboard request must not resolve or modify a fraud case.

The exact fraud rules are TBD unless explicitly implemented.

---

# 15. Refund and Reversal Rules

Refunds and reversals must follow the existing refund domain.

Potential refund states may include:

- PENDING
- SUCCESS
- FAILED

Rules:

- Refund processing must be idempotent.
- A refund must not restore funds multiple times.
- Inventory rules are not applicable to wallet refunds unless
  explicitly required by the relevant domain.
- Wallet refunds must correctly restore the financial state.
- Reversal records must be auditable.
- Dashboard statistics must account for refunds and reversals
  according to the approved accounting policy.

---

# 16. Security and Sensitive Data

Never expose through normal user-facing APIs:

- passwordHash
- emailVerificationToken
- OTP values
- KYC document paths
- Internal fraud case details
- Private security credentials
- Internal database version fields
- Sensitive provider credentials

All protected endpoints must enforce authentication.

Authorization must be based on the authenticated user and
established role/ownership rules.

---

# 17. Open Business Decisions

The following rules require explicit confirmation if they are
not already implemented:

- Exact KYC tier definitions
- KYC status lifecycle
- KYC-based transaction restrictions
- Email verification restrictions
- Minimum and maximum transaction amounts
- Transfer fee policy
- Withdrawal fee policy
- Self-transfer policy
- Daily limit reset timezone
- Monthly limit reset policy
- Wallet freeze behavior
- Ledger accounting model
- Refund accounting treatment
- Reversal accounting treatment
- Cash flow classification
- Authoritative source for dashboard metrics
- Pending activity status mapping
- Fraud risk thresholds
- Currency conversion policy

Until these are defined, do not invent production financial rules.