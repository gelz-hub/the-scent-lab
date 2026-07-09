# Analytics & Reporting (Part 9)

## Architecture

```
/admin/analytics (6 dashboard tabs)
        |
        v
GET /api/admin/analytics/{sales,orders,payments,products,customers,shipments,inventory}
        |
        v
src/lib/analytics/{sales,orders,payments,products,customers,shipments,inventory}.ts
        |
        v
cached()  ->  Prisma read queries only (findMany/groupBy/aggregate)
                  against Order/Payment/Shipment/ProductVariant/Inventory/
                  InventoryMovement/User/Wishlist/Review
```

Every analytics module is **read-only by construction** — none of the
seven `get*Analytics()` functions ever calls `.create`, `.update`,
`.upsert`, or `.delete`, and none of them import a mutating function from
`PaymentService`, `InventoryService`, `ShipmentService`, `ProductService`,
`CustomerService`, or `OrderService`. Where a metric needs logic that
already exists elsewhere (e.g. "low stock" — `InventoryService.listLowStock()`
from Part 6), analytics calls that existing read function directly instead
of reimplementing the low-stock threshold comparison — the one place
"what counts as low stock" is decided stays Part 6's, per spec ("No
business logic duplication").

Every `/api/admin/analytics/*` route is gated by
`requirePermission('analytics', 'read')` (or `'write'` for the two
scheduled-report mutation routes) — the same RBAC system built in Part 8,
not a new one. `analytics` is granted to `SUPER_ADMIN`, `ADMIN`, `MANAGER`,
and `VIEWER` (read-only fits it perfectly) in `src/lib/rbac/permissions.ts`
— `STAFF` does not get it, matching the Part 8 spec's "Staff — Orders and
Shipments only."

## Metrics & Calculations

**Sales**
- *Revenue* (today/yesterday/7d/30d/monthly/yearly) — `sum(Payment.totalAmount)` where `status = 'PAID'`, keyed by `paidAt` (never `Order.total`, since an order can exist unpaid).
- *Gross Sales* — `sum(Order.subtotal)` for orders whose current payment is `PAID` in the window (pre-discount product revenue).
- *Net Sales* — `sum(Order.total)` for the same set (post-discount, includes shipping fee). No refunds exist yet (see "Refunds (future)" below) so nothing is deducted from Net Sales currently — this is called out explicitly, not silently assumed.
- *Average Order Value* — `netSales / paidOrderCount`.
- *Revenue per Day / Orders per Day* — the window's calendar days, each bucketed from the same payment/order rows above.

**Orders**
- Status counts — `groupBy` on `Order.status`.
- *Average Processing Time* — mean of (first `SHIPPED` `ShipmentStatusEvent.createdAt` − `Order.createdAt`) across orders in the window that reached `SHIPPED`.
- *Average Delivery Time* — mean of (`DELIVERED` event time − `SHIPPED` event time). Both reuse the existing Part 3 `ShipmentStatusEvent` audit trail — no new tracking was added.

**Payments**
- *Success Rate* — `PAID / (PAID + FAILED + EXPIRED)`. `PENDING`/`PROCESSING` attempts are excluded from the denominator since they haven't reached a terminal-for-this-purpose state yet — including them would understate the rate for reasons that have nothing to do with actual failure.
- *Revenue by Method* — `sum(Payment.totalAmount)` where `status = 'PAID'`, grouped by `Payment.method` (COD / ABA_KHQR / ABA_PAYWAY / CREDIT_CARD / BANK_TRANSFER).

**Products**
- *Best Selling (Products/Variants)*, *Highest Revenue* — aggregated from `OrderItem` rows belonging to orders with a `PAID` payment in the window, grouped by `productId` (products) or `productId + ml` (variants — the same key `order-integration.ts` and the Part 7 Buy Again endpoint already use to resolve a `ProductVariant`).
- *Most Wishlisted* — `groupBy` on `Wishlist.productId`.
- *Lowest Stock / Out of Stock* — delegates entirely to `InventoryService.listLowStock()` (Part 6) and the same `currentStock − reservedStock <= 0` check Part 6 already defines; not reimplemented here.
- *Slow Moving* — active variants with zero `OrderItem` rows in the window.
- *Most Viewed* — **not implemented.** No server-side view-tracking model exists; Part 7's "recently viewed" is client-side/per-device (`localStorage`, see `src/lib/account/README.md`), which can't answer "most viewed across all customers." Adding that would mean a new `ProductView` write path, which is out of scope for a read-only reporting pass — flagged here rather than faked with a placeholder number.

**Customers**
- *New Customers* — `User.count` where `role = 'CUSTOMER'` and `createdAt` in the window.
- *Returning Customers* — customers (with ≥1 order in the window) who have more than one order total.
- *Repeat Purchase Rate* — `returningCustomers / activeCustomers` (customers with any order in the window).
- *Customer Lifetime Value* — **future**, per spec; not computed (would need a churn/retention model this pass doesn't build).

**Shipments**
- Status counts, courier usage — straightforward `groupBy` on `Shipment.status`/`deliveryCompany`.
- *Average Delivery Time* — same calculation as Orders' version (kept in both modules since Operations and Sales dashboards both want it without cross-importing).

**Inventory**
- *Current/Reserved Inventory Value* — `sum((variant.costPrice ?? variant.price) * inventory.currentStock|reservedStock)` across active variants. Falls back to `price` when `costPrice` wasn't set at variant-creation time (Part 6 made `costPrice` optional), so the value is never silently zero for a variant that just doesn't have a cost recorded.
- *Inventory Turnover* — `unitsSold (SALE movements in window) / currentTotalStock`. This is a simplified approximation, not the textbook "COGS ÷ average inventory value" ratio, because computing a true average would require a stock snapshot at the start of the window, which isn't tracked. Documented here rather than presented as more precise than it is.

## Report Architecture

Every category is one file in `src/lib/analytics/` exporting one
`get*Analytics(range: DateRange)` function, called by exactly one API
route (`src/app/api/admin/analytics/{category}/route.ts`) and by the CSV
export route (`.../export/route.ts`) — the export route calls the **same**
function the dashboard tab calls, over the same resolved range, so a CSV
can never show different numbers than the screen it was exported from
(the Part 9 verification requirement "Exports match displayed data" holds
by construction, not by keeping two implementations in sync by hand).

`src/lib/analytics/date-ranges.ts` (`resolveDateRange`) is the one place
"Today" / "Yesterday" / "7 Days" / "30 Days" / "90 Days" / "Custom Range"
get turned into concrete `{start, end}` timestamps — every route parses its
`?range=&from=&to=` query params through the shared
`parseRangeFromRequest()` helper, so no route defines its own notion of
"last 7 days."

## Caching Strategy

`src/lib/analytics/cache.ts` (`cached(key, fn, ttlMs)`) is an in-process
`Map`-based TTL cache — every `get*Analytics()` call is wrapped in it (1
minute default; the fixed-period revenue snapshot used on every dashboard
tab gets 5 minutes since it changes less often relative to how frequently
it's requested).

**This is explicitly an interim, single-instance implementation** — a
serverless deployment with multiple instances won't share this cache
(each instance has its own `Map`), and it's lost on every cold start. It
exists to "prepare for caching" per spec: every call site already goes
through one function, so swapping the body of `cached()` for a Redis/
Vercel KV/Upstash-backed implementation later touches exactly one file,
not the twenty-plus call sites across the seven analytics modules.

## Scheduled Reports (architecture only, per spec)

`ScheduledReport` (schema) + `src/lib/analytics/scheduled-report-service.ts`
store **configuration** — which report, `DAILY`/`WEEKLY`/`MONTHLY`
frequency, recipient emails, enabled flag — via
`GET/POST /api/admin/analytics/scheduled-reports` and
`PATCH/DELETE .../scheduled-reports/[id]`.

**Nothing executes a schedule yet.** No cron job reads this table, and no
email is sent. The intended future execution path (documented, not built):
a scheduled route (mirroring `src/app/api/cron/expire-payments` from Part
5) would, on its trigger, find `ScheduledReport` rows due to run, call the
same `get*Analytics()` function the dashboard already uses for that
`report` value, format it (reusing the CSV export's row-building logic),
and hand it to an `EmailService` — which doesn't exist either, since Resend
was intentionally disconnected in an earlier part (see the main project
history) and hasn't been reconnected. Building the scheduler and the
emailer are both explicitly out of scope for this pass; the schema and
config CRUD exist so that work has a starting point.

## Dashboards

One page (`/admin/analytics`), six tabs, sharing a single fetch of all
seven analytics endpoints per range change (admin data volumes don't
warrant per-tab lazy loading):

- **Executive** — today/month revenue, orders in range, AOV, revenue-per-day chart, order status pie, best sellers.
- **Sales** — gross/net sales, AOV, revenue-per-day and orders-per-day charts, the four fixed revenue snapshots.
- **Operations** — order status KPIs (preparing/shipped/delivered/cancelled), avg processing/delivery time, shipment status + courier usage charts, failed deliveries/returns.
- **Inventory** — current/reserved inventory value, low stock, out of stock, units sold, turnover, movements-by-type chart, slow movers.
- **Customer** — new/returning, average spend, repeat purchase rate, top customers.
- **Finance** — payment success rate, failed/expired counts, gross sales, revenue-by-method chart, payment-method usage pie.

Charts (`src/components/admin/analytics/charts.tsx`) are thin `recharts`
wrappers (already a project dependency, used by the existing
`dashboard-client.tsx` from Part 8) — `SimpleLineChart`/`SimpleBarChart`/
`SimplePieChart`. KPI tiles and top-N lists are their own small shared
components (`kpi-card.tsx`, the `TopList`/`ChartCard` helpers in
`analytics-client.tsx`).

## Export

CSV only. `GET /api/admin/analytics/export?report=<category>&range=...`
reuses `src/lib/export/csv.ts` (the same helper Part 8's admin-table
exports use). "Excel" per the spec is satisfied by CSV opening natively in
Excel — a true `.xlsx` exporter (multi-sheet, formatted, formulas) is
**not implemented**; no `xlsx`-generation library is installed. PDF export
is explicitly future per spec and also not implemented.

## Performance

- Every query is a Prisma `aggregate`/`groupBy`/`count`, or a `findMany`
  scoped to the requested date range with a `select` limited to the
  columns actually used — no `SELECT *` equivalents, no N+1 loops over
  unbounded result sets.
- Top-N lists (`bestSelling`, `topCustomers`, etc.) are capped at 10-20
  rows server-side before being returned, not paginated client-side from a
  larger payload.
- The in-process TTL cache (above) absorbs repeated requests for the same
  range within its window, which is the main defense against "expensive
  query, requested often" — real pagination for genuinely large exports
  (e.g. a full year of daily granularity) wasn't needed at this store's
  data volume and wasn't added speculatively.

## Future BI integration

The read-only, service-boundary-respecting design here — one function per
metric category, callable from a route, a CSV exporter, or (later) a
scheduled email — is deliberately the same shape a future BI tool
integration would need: a `get*Analytics()` function could be called from
a dedicated `/api/admin/analytics/*/raw` endpoint returning unaggregated
rows for a data warehouse sync, or the whole module could be pointed at a
read replica instead of the primary database connection (`src/lib/db.ts`)
without changing any calculation logic. Neither was built in this pass —
noted as the natural next step, not implemented speculatively.

## Verification performed

- **Revenue matches paid orders**: cross-checked `getSalesAnalytics()`'s
  `revenue` figure against a manual `db.payment.aggregate` for the same
  window on live data — identical.
- **Inventory reports match stock**: `currentInventoryValue`/`lowStockCount`
  cross-checked against the Part 6 `/admin/inventory` page's own numbers
  for the same variants — identical (both ultimately read the same
  `Inventory` rows; `lowStockCount` explicitly delegates to
  `listLowStock()`, so this is true by construction).
- **Payment reports match transactions**: `byMethod`/`byStatus` counts
  cross-checked against `db.payment.count` filtered the same way.
- **Shipment reports match shipment history**: `byStatus` cross-checked
  against `db.shipment.groupBy` on live data; delivery-time calculation
  traced against a real `ShipmentStatusEvent` pair.
- **Exports match displayed data**: verified by construction (same
  function call) and spot-checked by downloading a CSV and comparing rows
  to the corresponding dashboard tab.
- `tsc --noEmit` held at the same 53 pre-existing, unrelated errors
  throughout this part — zero regressions, and no existing
  Checkout/Payment/Shipping/Inventory/Product/Customer/Admin route or
  service was modified to build this module.
