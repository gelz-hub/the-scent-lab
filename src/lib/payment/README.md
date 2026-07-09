# Payment System

## Architecture

```
CheckoutService (checkout page / POST /api/orders)
        |
        v
   PaymentService  ----->  PaymentProvider (COD / ABA KHQR / ABA PayWay)
        |
        v
(orchestration layer — NOT PaymentService itself)
        |
        +--> InvoiceService
        +--> NotificationService
        +--> ShipmentService (existing shipment auto-creation on order)
```

`PaymentService` (`payment-service.ts`) is the only thing that writes to the
`Payment` and `PaymentEvent` tables. It:

- creates payments (`createPayment`, `createRetryPayment`)
- verifies payments against the provider (`verifyPayment`)
- expires overdue payments (`expireOverduePayments`)
- records a `PaymentEvent` on every state transition

It **never** calls `InvoiceService` or `NotificationService` directly. The
orchestration boundary lives in `orchestrate-verification.ts`
(`verifyAndAdvanceOrder`), which is the one function that:

1. calls `PaymentService.verifyPayment`
2. on a fresh transition into `PAID`, advances the order and calls
   `InvoiceService.generateAndStoreInvoice` + `NotificationService.notifyPaymentConfirmed`

Every caller that can cause a payment to become `PAID` — the customer poll
route, the admin re-verify route, and the ABA PayWay webhook — goes through
`verifyAndAdvanceOrder`, never `verifyPayment` directly, so invoice/
notification generation can never be skipped or duplicated depending on
which path finalized the payment.

`InvoiceService` and `NotificationService` remain fully independent of
`PaymentService` and of each other — neither imports the other, and neither
is ever imported by a `PaymentProvider`.

## Payment lifecycle

```
PENDING --(provider confirms)--> PAID --> Invoice --> Notification --> Shipment
   |
   +--(expiresAt passes)--------> EXPIRED
   |
   +--(provider reports failure)-> FAILED
   |
   +--(staff/customer cancels)---> CANCELLED

PAID --(future)--> REFUNDED / PARTIALLY_REFUNDED
```

`PAID`, `FAILED`, `EXPIRED`, and `CANCELLED` are terminal **for that
attempt** — `verifyPayment` short-circuits immediately for any of them
without calling the provider or writing a new event. `PAID` is the only one
of those that can still move again in the future (to `REFUNDED` /
`PARTIALLY_REFUNDED`, not yet implemented beyond the schema).

## Expiration

Every `Payment` gets an `expiresAt` at creation time
(`PAYMENT_TIMEOUT_MINUTES`, default 15). Two independent things enforce it,
so expiry never depends on the customer's browser being open:

1. **On-demand, at verification time** — `verifyPayment` checks `expiresAt`
   before doing anything else. If it has passed, the payment is marked
   `EXPIRED` and the provider is never even called. There's also a
   second check immediately before accepting a `PAID` result, closing the
   race where a provider confirmation arrives after the deadline.
2. **Background sweep** — `expireOverduePayments()` finds every
   `PENDING`/`PROCESSING` payment whose `expiresAt` has passed and marks it
   `EXPIRED`, independent of anyone polling. Exposed at
   `GET/POST /api/cron/expire-payments`, scheduled via `vercel.json`
   (`*/5 * * * *` by default — `PAYMENT_EXPIRATION_SWEEP_INTERVAL_MINUTES`).
   Protected by `CRON_SECRET` (bearer token) so it can't be triggered by an
   arbitrary request in production.

**The Order is never touched by expiration.** An expired payment leaves the
order exactly as it was — expiration is a payment-attempt concern, not an
order-cancellation trigger. The customer (or staff) can always retry.

## Payment retry

If a payment expires or fails, the system never creates a new Order:

```
Order
  |
  +-- Payment #1 (EXPIRED)   <- kept forever, untouched
  |
  +-- Payment #2 (FAILED)    <- kept forever, untouched
  |
  +-- Payment #3 (PENDING)   <- current attempt, created by retry
```

`createRetryPayment(order, method)`:

- only creates a new `Payment` row if the order's most recent attempt is
  terminal (`FAILED`/`EXPIRED`/`CANCELLED`) — if the latest attempt is still
  active (`PENDING`/`PROCESSING`/`PAID`) it's returned as-is, so double-
  clicking "Try again" can't spawn parallel attempts
- is bounded by `PAYMENT_RETRY_LIMIT` (default 5) per order
- never edits or deletes a previous `Payment` or its `PaymentEvent` history

Exposed at `POST /api/payments/[id]/retry`. The checkout success page's
`PaymentPanel` shows a "Try again" button once a payment reaches `FAILED` or
`EXPIRED`, which swaps in the new payment's QR/redirect without a page
reload.

Because `Payment.orderId` is not unique, `Order.payments` is a list. `"The"`
current payment for display purposes is always the most recent row
(`ORDER BY createdAt DESC LIMIT 1`) — every read path that used to expect a
single `payment` continues to receive that shape (`payment: payments[0] ??
null`), while `payments` (full history, oldest first) is also included for
any UI that wants to show the retry timeline.

## Payment timeline

`buildPaymentTimeline()` (`timeline.ts`) turns a payment's `PaymentEvent`
rows into a small, fixed set of customer-facing milestones:

```
Payment Created
      |
Waiting for Payment
      |
Payment Verified
      |
Invoice Generated
      |
Preparing Order
```

(or, for a terminal attempt: `Payment Created -> Payment Failed / Expired /
Cancelled`.) It never returns provider responses, internal event messages,
or staff identities — only `{ key, label, description, completedAt, status
}` per step, reusable by any future UI. Exposed at
`GET /api/payments/[id]/timeline`.

The admin-facing full timeline (raw `PaymentEvent` rows, provider responses,
staff names) is a separate, staff-only view at
`GET /api/admin/payments/[id]` — the two are never merged into one response.

## Idempotency

Every path that can create or finalize a payment is idempotent:

- **`createPayment`** — reuses the order's existing payment (any status) if
  one exists; only `createRetryPayment` (an explicit action) creates a new
  row, and only once the previous attempt is terminal.
- **`verifyPayment`** — a payment already `PAID` or terminal short-circuits
  immediately; a provider-confirmed `PAID` result is written with a
  conditional update against `providerTransactionId`'s unique constraint, so
  two concurrent verifications for the same transaction can't both "win".
- **`expireOverduePayments`** — uses `updateMany` scoped to the payment's
  current status (`WHERE id = ? AND status = ?`) so a concurrent
  `verifyPayment` call racing the sweep can't have its result overwritten.
- **Webhooks** — see below.

## Webhook flow (ABA PayWay)

`POST /api/payments/webhook/aba-payway`:

1. Read the raw request body and compute a SHA-256 `payloadHash` before
   parsing anything — the exact bytes ABA sent are always recoverable.
2. If ABA's `tran_id` (used as the provider event id) is missing, or no
   `Payment` matches it, store a `WebhookEvent` with status `FAILED` and
   return an error — nothing is processed.
3. **Duplicate check**: if a `WebhookEvent` with the same `provider` +
   `providerEventId` already has status `PROCESSED`, this delivery is stored
   as a new row with status `DUPLICATE` and ignored — `verifyAndAdvanceOrder`
   is never called a second time for an event already handled.
4. Otherwise, a `WebhookEvent` row is created with status `RECEIVED` —
   **before** any processing is attempted, so the delivery itself is
   permanently on record regardless of what happens next.
5. `verifyAndAdvanceOrder(payment.id)` runs (backend-verifies against ABA's
   Check Transaction API, never trusts the callback's own fields). On
   success the `WebhookEvent` is stamped `PROCESSED`; on failure it's stamped
   `FAILED` with `errorMessage`, and the route returns `500` so ABA's own
   delivery retries — safe, because step 3 makes redelivery a no-op once a
   later attempt does succeed.

Structured logs (`logPaymentEvent` in `monitoring.ts`) are emitted for
`webhook_received`, `webhook_duplicate`, and `webhook_failed` at every stage,
independent of the `WebhookEvent` audit rows.

`WEBHOOK_RETRY_WINDOW_MINUTES` documents how long a delivery retry from the
provider is still meaningful to accept (a payment's own `expiresAt`, checked
inside `verifyPayment`, is what actually blocks a very late callback from
ever producing `PAID`).

**TODO before production**: ABA signs its callbacks. Signature verification
should be added to this route once the exact callback payload/signing
scheme is confirmed against a live ABA sandbox transaction — this hasn't
been observed yet since it requires a real ABA sandbox merchant account and
a browser completing their hosted checkout page.

## WebhookEvent audit

Every inbound webhook call — successful, duplicate, or failed — is stored as
a `WebhookEvent` row:

| Field | Purpose |
|---|---|
| `provider` | e.g. `"ABA_PAYWAY"` |
| `providerEventId` | the provider's own idempotency key (ABA's `tran_id`) |
| `paymentId` | resolved `Payment`, nullable (unresolvable deliveries still get a row) |
| `payloadHash` | SHA-256 of the raw body — the fallback dedupe signal |
| `requestBody` | the raw body, verbatim |
| `headers` | request headers, with `authorization`/`cookie`/`x-api-key` redacted |
| `status` | `RECEIVED` \| `PROCESSED` \| `DUPLICATE` \| `IGNORED` \| `FAILED` |
| `errorMessage` | set only on `FAILED` |

Rows are never edited after `processedAt` is stamped except for that final
status/error write — this is an audit log, not a queue, and nothing is ever
deleted.

## Payment verification

Backend verification is the **only** path that can move a payment from
`PENDING` to `PAID`, and by extension the only path that can trigger
Invoice → Notification → Shipment. No route ever accepts a client-supplied
status and writes it directly — `POST /api/payments/[id]/verify`, the admin
equivalent, and the ABA webhook all funnel through the same
`verifyAndAdvanceOrder` → `PaymentService.verifyPayment` → provider call.
There is no second code path that bypasses this.

## Provider architecture

`PaymentProvider` (`providers/types.ts`) is the interface every concrete
provider implements (`createPayment`, `verifyPayment`). Adding a new
provider (Wing, ACLEDA, Stripe, Apple Pay, ...) means writing a new file
implementing that interface and adding one line to the `getPaymentProvider`
switch in `providers/index.ts` — `PaymentService`, the checkout flow, and
every route are unaffected.

ABA PayWay is environment-aware: `getPaymentEnvironment()` reads the
dedicated `PAYMENT_ENVIRONMENT` var (never inferred from `NODE_ENV`) and
`aba-payway-provider.ts` loads `PAYWAY_SANDBOX_*` or `PAYWAY_PRODUCTION_*`
credentials accordingly — switching environments is purely an env var
change.

ABA KHQR (`ABA_KHQR` method) is fulfilled via the third-party KHQRAPI.com
service (`providers/khqrapi-provider.ts`) — same `PaymentProvider` interface,
`KHQRAPI_SECRET_KEY` is the only credential, server-only.

### ABA PayWay smoke test (Sandbox — confirmed production-ready for Hosted Checkout)

The Purchase (`createPayment`) and Check Transaction (`verifyPayment`) APIs
were both exercised live against the ABA PayWay Sandbox using the merchant's
real sandbox credentials. Two corrections came out of this that the initial
implementation had wrong (fixed in the current code, documented here so a
future re-implementation doesn't repeat them):

1. **Content type**: the Purchase API requires `multipart/form-data`, not
   `application/x-www-form-urlencoded`. The wrong content type produces a
   generic rejection, not a helpful error.
2. **`tran_id` constraints**: ABA rejects any `tran_id` over 20 characters
   or containing `#` (our order numbers are prefixed with it) with a 400 —
   `"The tran_id cannot empty and exceed 20 characters."`. Fixed by
   generating a short opaque id (`T<base36 timestamp><6 hex chars>`, ≤20
   chars) instead of deriving it from the order number. The human-readable
   order number is still on the `Payment` row itself for support/lookup —
   `tran_id` only needs to be unique.
3. Once both were fixed, `req_time + merchant_id + tran_id + amount +
   firstname + lastname + email + type + return_url + continue_success_url
   + currency` (only the fields actually sent, in ABA's documented
   canonical order, with unsent optional fields omitted rather than
   included as empty strings) produced a valid HMAC-SHA512 signature and a
   `200` response — no further "Wrong Hash" errors.

**Confirmed request/response flow:**

```
createPayment
  -> POST https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase
     Content-Type: multipart/form-data
     fields: req_time, merchant_id, tran_id, amount, firstname, lastname,
             email, currency, type=purchase, return_url,
             continue_success_url, hash
  <- 200 { qrString, qrImage (base64 PNG), abapay_deeplink, app_store,
           play_store, status: { code: "00", message: "Success!", tran_id } }
```

**Sandbox-specific behavior worth flagging**: for this merchant's
configuration, the Purchase API responds with a ready-to-scan KHQR
(`qrString`/`qrImage`) directly in the `200` JSON response rather than
redirecting to a hosted card-entry page. `createPayment` renders that QR the
same way the KHQRAPI provider does (`qrPayload`/`qrImageDataUrl`) — no
browser form-POST is needed for this response shape. `CreatePaymentResult`
still supports `formAction`/`formFields` for a future `payment_option` that
returns a hosted redirect page instead (per ABA's docs, that variant
requires the customer's own browser to submit the signed form directly to
the Purchase URL, since it renders an interactive card-entry page in that
customer's session) — `PaymentPanel` already renders an auto-submitting
form for that case, it's just unused while this merchant configuration
returns a QR.

```
verifyPayment
  -> POST https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/check-transaction-2
     Content-Type: application/json
     body: { req_time, merchant_id, tran_id, hash }
  <- 200 { data: { payment_status: "PENDING" | "APPROVED" | "PRE-AUTH" |
                    "DECLINED" | "CANCELLED" | "REFUNDED", ... },
           status: { code: "00", message: "Success!", tran_id } }
```

`status.code` reports whether the *check-transaction call itself* succeeded
("00") or hit an API-level problem (5 invalid hash, 6 transaction not found
yet, 8 invalid merchant, 11 internal error, 429 rate limit) — those are
surfaced as `PENDING` (transient/retryable) rather than `FAILED`, since none
of them mean the payment was rejected. The actual payment outcome is
`data.payment_status`, mapped `APPROVED`/`PRE-AUTH` → `PAID`,
`DECLINED`/`CANCELLED` → `FAILED`, everything else → `PENDING`.

**Verified through this integration** (using the real order-creation route
plus a stubbed-provider run of `verifyAndAdvanceOrder` to simulate a
completed sandbox payment, since actually completing one requires a human
in a browser): a real signed request is accepted by the Sandbox; the
transaction reference (`tran_id`) is stored as `Payment.providerReference`
and round-trips correctly through Check Transaction; the payment stays
`PENDING` until verification reports otherwise; a simulated `APPROVED`
result transitions the payment to `PAID` exactly once (a second
`verifyAndAdvanceOrder` call on an already-`PAID` payment is a no-op, per
the idempotency guarantee); exactly one `PaymentEvent` is written for the
transition; exactly one `Invoice` is generated; `notifyPaymentConfirmed`
fires its usual one-time notification set (`PAYMENT_CONFIRMED`,
`INVOICE_GENERATED`, `ORDER_PREPARING`) with no duplicates.

**Sandbox limitation**: the Sandbox has no way to programmatically simulate
a customer completing payment — that requires a human following the
`abapay_deeplink`/QR in ABA's mobile app (or a card-entry page, for a
`payment_option` that returns one) against real sandbox test rails. The PAID
transition above was therefore verified by stubbing only the external ABA
HTTP call and running the real `verifyAndAdvanceOrder` → `PaymentService` →
`InvoiceService`/`NotificationService` code path — everything except "did
ABA actually receive money" was exercised for real.

**Production migration for Hosted Checkout is env-vars-only**: replace
`PAYWAY_SANDBOX_*` credentials with `PAYWAY_PRODUCTION_*` ones from ABA Bank
and set `PAYMENT_ENVIRONMENT=production` — no code change. (This applies to
the Hosted Checkout / Purchase-API flow implemented here; the Direct API,
which needs the RSA key pair for client-side card encryption, is explicitly
out of scope per the payment spec's "never handle raw card data" rule.)

## Configuration

All payment timing values live in `config.ts` — no magic numbers elsewhere:

| Constant | Env var | Default |
|---|---|---|
| `PAYMENT_TIMEOUT_MINUTES` | `PAYMENT_TIMEOUT_MINUTES` | 15 |
| `PAYMENT_RETRY_LIMIT` | `PAYMENT_RETRY_LIMIT` | 5 |
| `WEBHOOK_RETRY_WINDOW_MINUTES` | `WEBHOOK_RETRY_WINDOW_MINUTES` | 60 |
| `PAYMENT_POLL_INTERVAL_MS` | `PAYMENT_POLL_INTERVAL_MS` | 4000 |
| `PAYMENT_EXPIRATION_SWEEP_INTERVAL_MINUTES` | `PAYMENT_EXPIRATION_SWEEP_INTERVAL_MINUTES` | 5 |

(`PaymentPanel`'s client-side poll interval is a local constant mirroring
`PAYMENT_POLL_INTERVAL_MS`, since client components can't read server env
vars — keep the two in sync if either changes.)

## Monitoring

`logPaymentEvent()` (`monitoring.ts`) is the single place payment-related
operational events are logged from — `payment_created`,
`payment_creation_failed`, `verification_failed`, `webhook_received`,
`webhook_failed`, `webhook_duplicate`, `payment_expired`, `retry_attempted`,
`retry_blocked`. Every entry is structured JSON with `paymentId`/`orderId`
context, greppable by `[payment]` prefix. API routes never surface these
details to the customer — failures return a generic message
(`"Unable to process your payment. Please try again."`-style) while the
structured log carries the real cause.

## Future production migration

- Add ABA PayWay callback signature verification (see Webhook flow above).
- Implement `Refund` processing (schema already supports it — `RefundStatus`
  lifecycle, `Refund` rows against a `Payment`, never deleting payment
  history).
- Swap `console.error`/`console.warn` in `monitoring.ts` for a real sink
  (Sentry, Datadog, CloudWatch) — call sites don't change.
- Add remaining providers (Wing, ACLEDA, Visa/Mastercard direct, Apple Pay,
  Google Pay) as new `PaymentProvider` implementations.
- Move the expiration sweep off Vercel Cron if the deployment target changes
  — `expireOverduePayments()` has no framework dependency, so any scheduler
  that can hit `POST /api/cron/expire-payments` (or import the function
  directly into a standalone worker) works unchanged.
