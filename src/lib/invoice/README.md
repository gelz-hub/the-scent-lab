# Invoice System

Generates, stores, and serves order invoices as PDFs. Cloudinary is the
permanent storage provider. Version 1 has no email integration by design —
see "Future: EmailService" below.

**Status: production-ready.** Cloudinary PDF delivery is configured and
verified (Settings → Security → "PDF and ZIP files delivery" is enabled on
the account). Uploads, public delivery, View/Download, and rollback have all
been tested end-to-end against the live Cloudinary account.

## Folder structure

```
src/lib/invoice/
  InvoiceDocument.tsx         @react-pdf/renderer layout — the actual invoice design
  generate-invoice.ts         buildInvoiceData() + generateInvoicePdf(order, invoiceNumber) — pure PDF rendering, no I/O beyond that
  invoice-number-config.ts    Active format + prefix + padding, env-overridable
  invoice-number-service.ts   InvoiceNumberService — the only thing that generates invoice numbers
  invoice-service.ts          InvoiceService — generates, uploads, stores, and retrieves invoices

src/app/api/invoices/[orderId]/
  route.ts          GET — metadata (invoiceNumber, status, generatedAt, viewUrl) for the order owner or staff
  view/route.ts      GET — redirects to the Cloudinary PDF, inline
  download/route.ts  GET — redirects to the Cloudinary PDF, forced attachment
```

## Storage model

Every invoice stores **both**:
- `pdfPublicId` — the Cloudinary public id (e.g. `the-scent-lab/invoices/INV-20260708-0001.pdf`). This is the canonical handle for every future operation — delete, replace, regenerate, move folders, versioning.
- `pdfUrl` — the URL Cloudinary returned at upload time, kept for reference/debugging.

**Every delivery URL is built from `pdfPublicId` via `getInvoiceDownloadUrl()`**, which calls `cloudinary.url()` — never by parsing or string-replacing `pdfUrl`. This is what lets `/view` and `/download` differ by a single `flags: 'attachment'` option, and is what any future signed-URL or versioning feature would hook into.

## Generation workflow — reserve first, permanent record

```
Payment Successful
  ↓
InvoiceService.generateAndStoreInvoice(order)
  1. Reserve — InvoiceNumberService.generate(orderId, date), then immediately
     create the Invoice row: status = PENDING, pdfPublicId/pdfUrl/generatedAt = null
  2. Render PDF (generateInvoicePdf, given the reserved number)
  3. Upload to Cloudinary (raw resource type, the-scent-lab/invoices folder)
  4. Finalize — update the SAME row: pdfPublicId + pdfUrl + status: GENERATED + generatedAt
  ↓
NotificationService.notifyPaymentConfirmed(...)   — a separate, independent call
```

The number is allocated **before** any PDF work happens — treated as
immutable accounting data once reserved, the same way a paper invoice book
permanently consumes a number when a page is torn out, whether or not that
invoice was ever completed. Only triggered when `payment.status === 'PAID'`
— never for a still-pending COD order (see `POST /api/orders`).

## Invoice numbering

`InvoiceNumberService` (`invoice-number-service.ts`) owns numbering,
completely separate from PDF rendering/storage — a numbering-scheme change
never touches `InvoiceService`, the PDF layout, or the API routes.

**Current default** (`DATE_ORDER_SUFFIX`): `INV-20260708-RSO3RG` — the date
plus the last 6 characters of the order id. No database round-trip needed;
uniqueness comes for free from the order id.

**Future formats**, switchable via `INVOICE_NUMBER_FORMAT` with zero code
changes:
- `YEAR_SEQUENTIAL` → `INV-2026-000001`
- `YEAR_MONTH_SEQUENTIAL` → `INV-202607-000234`

Sequential formats are backed by `InvoiceNumberCounter`, one row per reset
scope (a year, or a year+month), incremented atomically via a Prisma
`upsert` with `{ value: { increment: 1 } }` — safe under concurrent order
creation because the increment happens as a single DB-level operation, not a
read-then-write in application code.

`prefix` (default `INV`) and `sequentialPadding` (default `6`) are also
env-configurable — this is how `TSL-2026-000001` or `TSL-INV-000001` would
be produced, by setting `INVOICE_NUMBER_PREFIX` and picking the matching
format.

**Uniqueness is enforced at the database, not just in application code** —
`Invoice.invoiceNumber` and `InvoiceNumberCounter.scope` both carry a real
MySQL `UNIQUE KEY` (confirmed via `SHOW INDEX`), not just a Prisma
`@unique` annotation trusted blindly. `InvoiceNumberService.isUnique()`
exists only as a defensive convenience check, never the actual guarantee.

**Generate the number exactly once per invoice.** `InvoiceService` calls
`InvoiceNumberService.generate()` a single time and threads the result
through to both the PDF (`generateInvoicePdf(order, invoiceNumber)`) and the
DB row — never regenerate for the same invoice. Sequential formats are *not*
idempotent (each call consumes the next counter value), so calling generate
twice for one invoice would put a different number on the PDF than what's
stored. A failed generation attempt (see Error handling) can leave a gap in
a sequential counter — this is normal and expected in real invoicing systems
(a "voided" number), not a bug.

## Error handling — the reservation is permanent, never deleted

`InvoiceStatus` has three states: `PENDING` (reserved, no PDF yet),
`GENERATED` (complete), `FAILED` (reservation consumed, generation didn't
finish). The row created at reservation time is **never deleted** and its
`invoiceNumber` is **never reused** — a failure just moves it to `FAILED`:

| Failure point | Result |
|---|---|
| PDF rendering throws | Row → `FAILED`. Number stays permanently allocated. Logged. Returns `null`. |
| Cloudinary upload throws | Row → `FAILED`. Same number reused on retry (`overwrite: true`). Logged. Returns `null`. |
| DB write throws while finalizing, *after* a successful upload | Row → `FAILED`. The uploaded asset is **kept** (not destroyed) — a retry re-uploads to the same public id and finalizes the same row. Logged. Returns `null`. |

In every failure case the **order itself stays valid** — invoice generation
is a side effect of payment, never a precondition for the order to exist.
Calling `generateAndStoreInvoice` (or the staff-facing `regenerateInvoice`)
again for the same order finds the `PENDING`/`FAILED` row via
`reserveInvoice()` and resumes it — it never allocates a second number.

Verified directly: forced a real Cloudinary upload failure (bad credentials)
— the row correctly moved to `FAILED` with `pdfPublicId: null`. Retried with
working credentials — the **same row** (same id, same invoiceNumber)
finalized to `GENERATED`. No new row was created, no number was skipped or
reused.

## Architecture — independence is enforced, not just documented

- `InvoiceService` imports only `db`, `cloudinary`, and its own PDF/number helpers. It has never imported `NotificationService` or anything email-related.
- `NotificationService` (`src/lib/notification-center/`) imports only `db`. It doesn't know `InvoiceService` exists.
- The order route (`POST /api/orders`) is the only place that calls both, as two sequential, independently-failing steps.

## Future: EmailService

Version 1 ships with **no email sending** — customers view/download invoices
from their account instead. The `Invoice` model already has nullable
`emailedAt` / `emailStatus` / `resendCount` fields reserved for this.

A previously-built (now disconnected) `src/lib/email/` module already
contains a working Resend client + HTML templates for payment confirmation
and shipment notifications — wiring it back in means calling it from the
same spot `NotificationService` is called today, passing the already-stored
`pdfUrl` as the attachment source. `InvoiceService` itself needs no changes.

## Admin

Staff can View/Download an order's invoice from the shipment edit dialog
(`src/components/admin/shipment-edit-dialog.tsx`), which fetches
`GET /api/invoices/[orderId]` and links to `/view` and `/download`.
**Regenerate** and **Replace** are intentionally not built yet (spec marks
both "(future)") — `regenerateInvoice()` in `invoice-service.ts` exists as
the entry point for Regenerate when that UI gets built; Replace would follow
the same shape (delete the old Cloudinary asset by `pdfPublicId`, run the
same generate-and-store pipeline).
