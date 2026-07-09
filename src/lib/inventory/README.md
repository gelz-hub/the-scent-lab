# Product & Inventory Management (Part 6)

## Architecture

```
ProductService          InventoryService
(catalog CRUD,     Independent of  (Inventory + InventoryMovement
 variants, images)  each other      only — never Product/Order/
                                    Payment/Shipment)
        |                                   ^
        |                                   |
        +---------- order-integration.ts ---+
                  (orchestration only —
                   never writes to Inventory
                   itself; calls InventoryService)
                          ^
                          |
      called from (additive hooks, existing flows unmodified):
        - src/lib/payment/orchestrate-verification.ts   (PAID  -> reserve)
        - src/app/api/shipments/[id]/route.ts            (SHIPPED -> commit,
                                                            CANCELLED/RETURNED -> release)
        - src/app/api/orders/[id]/route.ts                (CANCELLED -> release)
```

`ProductService` and `InventoryService` never import each other or
Order/Payment/Shipment/Invoice/Notification code. `order-integration.ts` is
the only orchestration layer connecting inventory to the order lifecycle —
exactly the same independence pattern already used by
`orchestrate-verification.ts` for Payment -> Invoice -> Notification (see
`src/lib/payment/README.md`).

**Existing systems are unmodified in behavior.** Checkout, Address,
Shipping, Invoice, and Payment keep their original logic; the only changes
are a few additive function calls at points those systems already treat as
extensible hooks (shipment status transitions, order status transitions,
payment verification). Every hook call is wrapped in its own try/catch and
never throws into the caller — an inventory failure can never break
checkout, payment, or shipment updates.

## Database design

- **`Product`** — shared catalog information only: identity (`slug`,
  `name`, `description`, `shortDescription`), taxonomy (`brandId`/
  `categoryId`/`collectionId` — new relational FKs — plus the pre-existing
  legacy `brand`/`category`/`collection` string/JSON fields, kept
  unchanged so the current storefront keeps rendering without
  modification), images (`images` relation, `featuredImagePublicId`/
  `featuredImageUrl`), SEO (`seoTitle`/`seoDescription`), `status`,
  `visibility`, `currency`, and `deletedAt` (soft delete). **Deliberately
  has no `sku`, `barcode`, `price`, `costPrice`, `weight`, or `stock`** —
  those always belong to `ProductVariant`/`Inventory` (see "Product
  Variants" below). The legacy aggregate `stock` field the storefront
  already had is unchanged and still display-only; it's never written to
  by this module.
- **`Brand` / `Category` / `Collection`** — proper relational entities for
  the new catalog. The pre-existing plain `brand`/`category`/`collection`
  fields directly on `Product` are untouched (still what the storefront
  reads); the new `brandId`/`categoryId`/`collectionId` FKs are what admin
  tooling and future storefront work should adopt.
- **`ProductImage`** — one row per gallery image: `publicId` + `url`
  (Cloudinary), `altText`, `order`. Never store only a URL — `publicId` is
  the canonical handle for any future delete/replace/reorder, exactly like
  the Invoice system's `pdfPublicId` pattern.
- **`ProductVariant`** — the actual purchasable unit. Owns `sku` (unique),
  `barcode` (optional, unique), `name` (e.g. `"50ml"` or `"Default"`),
  `volumeMl`, `price`, `costPrice`, `weight`, `status`, and optional
  variant-specific Cloudinary image fields.
- **`Inventory`** — one row per variant (`variantId` unique). Stores only
  `currentStock`, `reservedStock`, `safetyStock`, `reorderLevel`.
  `availableStock` (`currentStock - reservedStock`) is always computed, at
  read time, in `InventoryService`/API responses — never stored, so it can
  never drift out of sync with the two numbers it's derived from.
- **`InventoryMovement`** — append-only audit trail, one row per
  stock-affecting event (`PURCHASE`, `SALE`, `RETURN`, `ADJUSTMENT`,
  `DAMAGE`, `TRANSFER`, `RESERVATION`, `RESERVATION_RELEASE`), recording
  `previousStock`/`newStock`/`quantity` (the difference), `reason`,
  `referenceId` (an order id for sale/reservation movements), `createdBy`,
  and `createdAt`. Rows are never edited or deleted.

## Product Variants

Every product has at least one variant — there is no "product without
variants" at the data level, only "a product with exactly one variant."

- **Multi-variant product** (e.g. Bleu de Chanel EDP): create the product,
  then create one `ProductVariant` per size (50ml/100ml/150ml), each with
  its own SKU, price, cost price, stock, barcode, weight. Inventory is
  tracked independently per variant — selling out of 50ml never affects
  100ml's stock.
- **Single-variant product** (e.g. Maison Margiela Replica By the Fireplace,
  100ml only): still exactly one `ProductVariant` row (named `"100ml"` or
  `"Default"` if the product genuinely has no meaningful size label). The
  storefront should skip rendering a size selector when a product has only
  one variant and auto-select it — see "Future storefront integration"
  below for how that plugs into the existing product detail page.
- **Enforcement**: `ProductService.createProductWithVariants()` always
  creates at least one variant in the same transaction as the product —
  if none are supplied, it auto-creates a `"Default"` variant from
  `singleVariantPrice`/`singleVariantStock`. `archiveVariant()` refuses to
  archive a product's last remaining non-archived variant, so the
  invariant holds for the lifetime of the product, not just at creation.
- Price, SKU, barcode, inventory, and weight **always** live on the
  variant — enforced by the schema itself (those columns don't exist on
  `Product`), not just by convention.

## Cloudinary images

Same pattern as the Invoice system's PDF storage
(`src/lib/invoice/README.md`): every image is stored as a
`{ publicId, url }` pair, never a bare URL, so any future
delete/replace/reorder/version operation uses `publicId` (the canonical
Cloudinary handle) rather than parsing a stored URL. `ProductImage` covers
the gallery; `Product.featuredImagePublicId`/`featuredImageUrl` cover the
one featured image; `ProductVariant.imagePublicId`/`imageUrl` cover an
optional variant-specific image (e.g. a different bottle photo per size).
Upload itself reuses the existing `/api/upload` Cloudinary endpoint the
admin product form already calls — this module only adds where the
returned `{ publicId, url }` gets stored.

## Inventory reservation, commit, and release

```
Payment verified (PAID)
        |
        v
reserveStockForOrder(orderId)     -- Inventory.reservedStock += qty
        |                            (Inventory.currentStock unchanged)
        v
   [ time passes, order is being packed/shipped ]
        |
        +--> Shipment marked SHIPPED
        |         |
        |         v
        |    commitStockForOrder(orderId)   -- currentStock -= qty
        |                                       reservedStock -= qty
        |                                       (permanent — this is the sale)
        |
        +--> Order/Shipment CANCELLED or RETURNED before shipment
                  |
                  v
             releaseStockForOrder(orderId)  -- reservedStock -= qty
                                                (currentStock unchanged —
                                                 nothing was ever removed)
```

Stock is **never reduced before payment confirmation** — nothing touches
`Inventory` at checkout/order-creation time, only after
`orchestrate-verification.ts` observes a fresh transition to `PAID`.
Stock is **never permanently reduced except at shipment** — cancellation
before that point only gives back the reservation, it never had anything
to "give back" from `currentStock`.

Every one of these three functions (`reserveStockForOrder`,
`commitStockForOrder`, `releaseStockForOrder`, all in
`order-integration.ts`) is:

- **Idempotent** — each checks for an existing `InventoryMovement` with the
  matching `referenceId` (the order id) and type before acting, so calling
  it twice (e.g. a shipment cancel AND an order cancel both firing release
  for the same order) is a safe no-op the second time.
- **Best-effort** — every per-item failure (insufficient stock, no
  variant configured yet for that product/size) is caught and logged via
  `logInventoryEvent`, never re-thrown into the payment/shipment/order
  route that triggered it. An inventory shortfall on an already-paid order
  is a fulfillment/staff concern (visible in the admin Inventory page's low
  stock view and the movement history), not something that unwinds a
  confirmed payment.
- **Resolved via `(productId, volumeMl)`** — `OrderItem` (part of the
  protected Checkout/Order system) only ever stored `productId` + `ml`, not
  a variant id, and that wasn't changed. `resolveVariant()` looks up the
  matching `ProductVariant` by `productId` + `volumeMl`; if none exists
  (a product that hasn't been migrated to the new variant system yet), the
  line item is skipped entirely — checkout/payment/shipment behave exactly
  as they did before this module existed for any product without variants
  configured.

## Concurrency safety (never oversell)

`InventoryService.reserveStock`/`commitReservedStock`/`releaseReservedStock`/
`adjustStock` all use **row-level locking**, not optimistic
compare-and-swap: each opens a transaction, runs
`SELECT ... FOR UPDATE` on the variant's `Inventory` row
(`lockInventoryRow`), validates (`available >= quantity` for a reservation,
`newStock >= 0` for an adjustment/commit), writes the new value, and
records the `InventoryMovement` — all inside that one transaction.

A concurrent request for the *same* variant doesn't race the first one; it
simply blocks on the row lock until the first transaction commits, then
proceeds with the now-current numbers. This was **verified against a real
bug during development**: an earlier version used an optimistic
compare-and-swap loop (read, compute, `updateMany` scoped to the
previously-read value, retry a bounded number of times on conflict) — under
20 concurrent reservation requests against 10 available units, only 5-6
succeeded even though all 10 units should have been reservable, because
requests were exhausting their retry budget on lock contention, not because
stock had actually run out. Switching to `SELECT ... FOR UPDATE` fixed this
completely: rerunning the identical 20-concurrent-request test now yields
exactly 10 successes (matching the 10 available units) and exactly 10
genuine `InsufficientStockError` failures — no spurious rejections, no
oversell, and no arbitrary retry-count ceiling on how much contention the
system can correctly absorb.

Two concurrent reservations for the last unit of stock: whichever
transaction's `SELECT ... FOR UPDATE` acquires the lock first sees
`available = 1`, reserves it, and commits; the second transaction then
acquires the lock, sees `available = 0` for itself, and throws
`InsufficientStockError`. Stock can never go negative and can never be
oversold under concurrent requests, and a legitimate request is never
rejected just because it had to wait its turn.

## Low stock

`isLowStock` is computed, never stored: `availableStock <= max(reorderLevel,
safetyStock, LOW_STOCK_THRESHOLD)` (`LOW_STOCK_THRESHOLD` — config.ts,
default 5). `InventoryService.listLowStock()` and
`GET /api/admin/inventory?lowStock=true` surface this in the admin
Inventory page, which shows a low-stock badge and count.

## Admin workflow

- **Products**: existing `/admin/products` page/API is unchanged. New
  product/variant creation for the Part 6 catalog goes through
  `ProductService.createProductWithVariants` (not yet wired into a
  dedicated admin form in this pass — see "Next steps" below) and the
  variant CRUD routes (`/api/admin/products/[id]/variants`).
- **Catalog settings** (`/admin/catalog`): manage Brands/Categories/
  Collections — create, list, delete.
- **Inventory** (`/admin/inventory`): search variants, filter to low-stock
  only, adjust stock (with a required reason — every adjustment records
  previous quantity, new quantity, the difference, the staff member, and a
  timestamp via `InventoryMovement`), view full movement history per
  variant.
- Manual adjustments are restricted to `PURCHASE`/`RETURN`/`ADJUSTMENT`/
  `DAMAGE`/`TRANSFER` — `RESERVATION`/`RESERVATION_RELEASE`/`SALE` can only
  ever be written by `order-integration.ts`, never by a direct staff
  action, so the audit trail can always distinguish "a human changed this"
  from "the order lifecycle changed this."

## Customer view

Customers should only ever see, per product: images, brand, category,
price (from the selected/only variant), available variants, stock status
(in stock / out of stock — a boolean, not the number), description, and
related products. Cost price, reserved stock, inventory history, and
internal SKU/barcode are staff-only — the customer-facing product API
(`GET /api/products`, `GET /api/products/[id]`) never selects
`costPrice`/`reservedStock`/`InventoryMovement` rows, and nothing in this
module changes that surface.

## Configuration

All thresholds/enums live in `config.ts` — no magic numbers elsewhere:
`LOW_STOCK_THRESHOLD`, `SUPPORTED_CURRENCIES`, `PRODUCT_STATUSES`,
`PRODUCT_VISIBILITIES`, `INVENTORY_MOVEMENT_TYPES`,
`MANUAL_ADJUSTMENT_TYPES`.

## Next steps (not built in this pass)

- A dedicated admin "create/edit product" form wired to
  `createProductWithVariants` + the variant/image routes (today, only the
  legacy product form at `/admin/products` exists; the new relational
  fields and variants are managed via the API/Inventory page but don't yet
  have a single combined product-authoring screen).
- Storefront integration: `src/app/(store)/product/[slug]/page.tsx`
  currently reads the legacy `volumes`/`stock` fields. Migrating it to
  read from `ProductVariant`/`Inventory` (hiding the size selector when a
  product has exactly one variant, per the "Product Variants" business
  rule above) is a storefront change, not an inventory-system change, and
  was intentionally left out of this pass to avoid touching the working
  storefront without a dedicated review.
- A backfill script that creates one `ProductVariant` (from each entry in
  `volumes`) per existing legacy product, so every already-seeded product
  gets real inventory tracking rather than only new products created
  through `ProductService`.
