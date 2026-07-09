# Admin Dashboard & Operations (Part 8)

## Architecture

Part 8 adds no new business-logic services — every admin feature is a thin,
permission-checked layer over the services already built in Parts 1-7:

```
Admin API route
   |
   +--> requirePermission(module, action)   [new — src/lib/rbac]
   |        |
   |        +--> 403 if the role can't touch this module/action
   |
   +--> existing service (unchanged):
          ProductService / InventoryService / PaymentService /
          ShipmentService (shipment routes) / InvoiceService /
          NotificationService / OrderService (order routes) /
          CustomerService (Part 7)
   |
   +--> recordAudit(...)   [new — src/lib/audit, on sensitive actions only]
```

No admin route re-implements order/payment/shipment/inventory/invoice
logic — they call the same functions the customer-facing and Part 5-7 code
already calls. The only things Part 8 actually adds are: the permission
gate in front of every route, the audit trail behind sensitive ones, and
new UI/aggregation surfaces (dashboard home, staff management, global
search, exports, settings, audit log viewer) that read from those existing
services rather than duplicating their logic.

## RBAC

Five staff-facing roles, plus the pre-existing `CUSTOMER`:

| Role | Modules |
|---|---|
| **Super Admin** | Everything (`orders`, `products`, `catalog`, `inventory`, `customers`, `payments`, `shipments`, `invoices`, `notifications`, `staff`, `settings`, `auditLog`, `search`) |
| **Admin** | Orders, Products, Inventory, Customers, Payments (+ Catalog, Invoices, Notifications, Search) |
| **Manager** | Orders, Inventory, Shipments (+ Invoices, Notifications, Search) |
| **Staff** | Orders, Shipments (+ Notifications, Search) |
| **Viewer** | Every module, but read-only everywhere |

The exact table is in `src/lib/rbac/permissions.ts` (`ROLE_ACCESS`) — the
single source of truth. `hasPermission(role, module, action)` is the only
function that answers "can this role do this"; nothing else re-implements
that logic. Invoices/Notifications/Search are granted alongside the
modules the spec lists them next to, rather than as a seventh always-on
module, since they're read-only support data for orders/payments rather
than a standalone administrative concern.

**Enforcement is server-side, always**: `requirePermission(module, action)`
(`src/lib/rbac/require-permission.ts`) wraps `getServerSession` +
`hasPermission` into one call every admin API route uses instead of
hand-rolling a role check. All 29 existing admin/staff-facing routes from
Parts 5-7 were retrofitted to call it (see the git history for that pass);
every new Part 8 route uses it from the start. The admin nav
(`admin-shell.tsx`) also filters links by `hasPermission(role, module,
'read')` — but that's a UX nicety only. Hiding a link never substitutes
for the route itself checking permission; every one of the sidebar's hrefs
enforces independently.

`middleware.ts`'s job is narrower than before: it only decides whether a
role may enter `/admin` at all (`isAdminRole()` — any of the five
non-customer roles). It grants no per-module access; that's entirely
`requirePermission`'s job, checked fresh on every request to every route.

### Adding a new permission

1. Add the module to `MODULES` in `permissions.ts` if it doesn't exist yet.
2. Add it to whichever roles' `modules` array in `ROLE_ACCESS` should have it.
3. Call `requirePermission('thatModule', 'read' | 'write')` in the route.

No code elsewhere needs to change — "configurable" per the spec means
editing this one file, not a live database-backed permission editor (which
wasn't built in this pass; see "Not built" below).

## Audit Log

`AuditLog` (schema) + `recordAudit()`/`listAuditLog()`
(`src/lib/audit/audit-service.ts`) — append-only: nothing in the codebase
ever updates or deletes a row. Every entry has `userId`, `action`,
`resource`, `resourceId`, `before`/`after` (loose JSON — whatever shape
makes sense for that action), `ipAddress`/`userAgent` (via
`requestMetadata(req)`, extracted from the request the same way in every
route that calls it), and `createdAt`.

Wired into:

- **Login/logout** — NextAuth `events.signIn`/`signOut` in `auth.ts` (no
  IP/user-agent available at that layer in NextAuth v4's event API — only
  actions triggered through a route handler, which does have the `Request`,
  capture those).
- **Order status changes** — `PATCH /api/orders/[id]`.
- **Shipment status changes, archive/cancel** — `PATCH`/`DELETE
  /api/shipments/[id]`.
- **Inventory adjustments** — `POST /api/admin/inventory/[variantId]/adjust`.
- **Payment verification** (manual re-verify and COD collection) —
  `POST /api/admin/payments/[id]/verify` and `.../mark-cod-collected`.
- **Product create/update/delete** — `/api/products`, `/api/products/[id]`.
- **Role changes and staff account creation** —
  `/api/admin/staff`, `/api/admin/staff/[id]`.
- **Settings changes** — `PATCH /api/admin/settings`.

`recordAudit()` never throws into its caller — an audit-log write failure
is logged to the console but never blocks the actual operation it's
recording (same "never corrupt the real thing over a side-effect"
discipline as Payment/Inventory's best-effort hooks in earlier parts).

View it at `/admin/audit-log` (`auditLog` module, effectively
Super-Admin-only per the role table above) — filterable by action, each
row expandable to show the raw before/after JSON.

## Dashboard architecture

`GET /api/admin/dashboard` is one aggregation read. It never assumes the
caller can see everything: each section (today's orders/pending
payments/preparing orders, shipment counts, revenue, low-stock count,
unread notifications, recent customer activity) is only computed and
included in the response if `hasPermission(role, thatModule, 'read')` — so
a STAFF role's dashboard payload genuinely doesn't contain revenue or
customer data, not just "the UI chooses not to render it." `todaysOrders`
gates on `orders`, `readyToShip`/`outForDelivery`/`deliveredToday` gate on
`shipments`, `revenueToday`/`revenueThisMonth` gate on `payments`,
`lowStockCount` gates on `inventory`, `unreadNotifications` gates on
`notifications`, `recentCustomerActivity` gates on `customers`.

`DashboardSummaryCards` (new) renders whatever subset of cards the payload
actually contains, above the existing `DashboardClient` (unchanged,
still the revenue chart / top products view from before this part).

## Staff Management

`StaffService` (`src/lib/rbac/staff-service.ts`) — `listStaff`,
`createStaffAccount`, `changeStaffRole`, `revokeStaffAccess`. Revoking
access demotes a user back to `CUSTOMER` rather than deleting their
account, preserving their order/audit history. A staff member can't change
their own role or revoke their own access (checked in the route, not just
the service) — prevents accidental self-lockout. Every create/role-change/
revoke is audited (`CREATE`/`ROLE_CHANGE` on resource `StaffAccount`).
Gated entirely behind the `staff` module, which only `SUPER_ADMIN` has in
the default `ROLE_ACCESS` table.

## Global Search

`GET /api/admin/search?q=` — same per-module gating pattern as the
dashboard: it only queries (and only returns) a section if the caller's
role can read that module, so a Staff search for a customer's email
returns nothing even if a customer record matches, since `customers` isn't
in Staff's module list. Covers orders (by order number), customers
(name/email), products (name or variant SKU), invoices (invoice number),
payments (provider reference/transaction id), shipments (tracking number).
`GlobalSearchBar` renders it as a debounced dropdown in the admin top bar.

## Export

`src/lib/export/csv.ts` is the one CSV-escaping/formatting implementation
every export route uses (`toCsv`, `csvResponseHeaders`) — generalized from
the Part 6 Payments export, which was the first one built. Routes:
`orders`, `customers`, `products`, `inventory`, `shipments`, `invoices`,
`payments` (existing) — each gated by `requirePermission(module, 'read')`
for its own module. `ExportCsvLink` is the shared "Export CSV" button
component, added to every list page's toolbar.

## System Settings

`SystemSetting` — one row per key (`shippingFees`, `lowStockThreshold`,
`invoicePrefix`, `paymentTimeoutMinutes`, `storeInformation`,
`businessHours`), `value` as loose `Json` so adding a new setting is never
a migration. `getAllSettings()` merges stored rows over
`DEFAULT_SETTINGS`, so a setting nobody has touched yet still has a sane
default. Every change is audited (`UPDATE` on resource `SystemSetting`,
with old/new value).

**Not wired to live consumers in this pass**: `PAYMENT_TIMEOUT_MINUTES`
(payment config), `LOW_STOCK_THRESHOLD` (inventory config),
`shippingFeeFor()` (checkout), and the invoice number prefix are still
read from their original `config.ts` constants/env vars, not from this
table — this pass built the storage + admin UI for these settings, but
retrofitting every one of those existing call sites to read from the DB
at request time (with caching) is separate follow-up work, called out
explicitly here rather than silently left half-done.

## Admin workflows this part adds/extends

- **Orders**: existing admin Orders page unchanged; added CSV export.
- **Payments**: existing admin Payments page (Part 5) unchanged — Manual
  Verify/Export already existed; Retry Verification is the same "re-verify"
  action already wired (idempotent, per `src/lib/payment/README.md`).
- **Shipments**: existing admin Shipments page unchanged; added CSV
  export; status-change audit logging added.
- **Products**: existing admin Products page (Create/Edit/Archive) and
  Part 6 variant/image management unchanged; added CSV export and
  create/update/delete audit logging. Duplicate Product was not built in
  this pass (see "Not built").
- **Inventory**: existing admin Inventory page (Part 6) unchanged; added
  CSV export; adjustment audit logging added on top of the existing
  `InventoryMovement` audit trail (two different audit mechanisms by
  design — `InventoryMovement` is the domain-specific stock ledger,
  `AuditLog` is the cross-cutting "who did this administrative action"
  record; see src/lib/inventory/README.md for the former).
- **Customers**: existing admin Customers page (Part 7) unchanged; added
  CSV export. Staff can view a customer's wishlist/review/address *counts*
  and order history there — never edit them, per spec.
- **Invoices**: existing view/download routes (Part 4) unchanged except
  the customer-vs-staff visibility check now goes through
  `hasPermission(role, 'invoices', 'read')` instead of a hardcoded
  `ADMIN`/`STAFF` check, so Manager/Super Admin/Viewer see the same staff
  view Admin/Staff always did. Added CSV export.
- **Notifications**: existing notification-center (Part 7) and the
  admin-only promotional-send endpoint (`/api/notifications/send`)
  unchanged except the same RBAC retrofit.

## Not built in this pass (called out explicitly, not silently skipped)

- **Duplicate Product** — no dedicated "clone this product + its variants"
  action; `ProductService.createProductWithVariants` already exists and
  could back one, but the admin button/flow wasn't built.
- **Restore (Product)** — `ProductService.restoreProduct` already exists
  (Part 6) but has no admin UI entry point yet.
- **Refund** — explicitly future per the Part 5 and Part 8 specs; `Refund`
  schema exists, no processing flow.
- **Regenerate Invoice** — explicitly future per spec; `InvoiceService`
  doesn't have a regenerate path yet, only initial generation + retry.
- **A live, database-backed permission editor** — the permission matrix is
  a code file (`permissions.ts`), not a settings-page toggle grid. It's
  "configurable" in the sense that changing it is a one-file, no-migration
  edit, not a runtime admin action.
- **Wiring System Settings values into their corresponding live config**
  (see "System Settings" above).

## Verification performed

- Confirmed every admin/staff-facing API route (all 29 pre-existing ones
  plus every new Part 8 route) goes through `requirePermission` — grepped
  for the old blunt `role !== 'ADMIN' && role !== 'STAFF'` pattern
  repository-wide after the retrofit; zero remaining matches outside
  customer-ownership checks (`role === 'CUSTOMER'`), which are a different,
  intentionally-unchanged concern.
- `tsc --noEmit` held at the same 53 pre-existing, unrelated errors
  throughout this part — zero regressions introduced.
- Manually traced that `AuditLog` writes never block their calling route
  (every `recordAudit` call site is either awaited after the real mutation
  already committed, or itself swallows its own errors).
