# Customer Account & User Experience (Part 7)

## Architecture

```
CustomerService      AddressService      WishlistService      ReviewService
(profile, avatar,    (saved address      (Wishlist table      (Review table,
 password)            book, default)      only)                delivered-only gate)
```

Each service is a standalone file under `src/lib/account/` that touches
exactly one concern and imports none of the others:

- `customer-service.ts` — profile fields + password change. Only touches `User`.
- `address-service.ts` — the saved-address book. Only touches `Address`.
- `wishlist-service.ts` — saved products. Only touches `Wishlist`.
- `review-service.ts` — product reviews. Only touches `Review`, and reads
  (never writes) `Order`/`OrderItem`/`Shipment` to check delivery eligibility.

`NotificationService` is unchanged — this module reuses the existing
`src/lib/notification-center/service.ts` (`listNotifications`, `unreadCount`,
`markRead`, `markAllRead`, `createNotification`) rather than duplicating it.

No service in this module imports Checkout/Payment/Invoice/Shipping/
Product/Inventory internals. Where account features need order data (Buy
Again, order detail, delivery gating for reviews), the API route reads
`Order`/`OrderItem`/`Shipment` directly — it never calls into
`PaymentService`/`InventoryService` and never writes to any table those
services own. Existing systems' behavior is unchanged; every account
feature is additive on top of what to already exists.

## Saved Addresses

`Address` is a reusable address book, deliberately separate from
`OrderAddress` (the immutable per-order snapshot Checkout already creates —
that model, and Checkout's `addressSchema`/order-creation logic, are
untouched). A customer can save multiple addresses (`label`: "Home",
"Office", "Family", ...) and mark exactly one as default.

- **Default selection**: enforced in `address-service.ts`, not the
  database — `setDefaultAddress` runs in a transaction that unsets every
  other address's `isDefault` before setting the new one (MySQL has no
  native "at most one true per row group" constraint). The first address a
  customer ever saves automatically becomes their default. Deleting the
  default promotes the next-most-recent remaining address, if any — a
  customer with saved addresses is never left without a default.
- **Checkout integration**: `SavedAddressSelector`
  (`src/components/checkout/saved-address-selector.tsx`) is inserted at the
  top of Checkout's existing address step. Selecting a saved address calls
  `form.setValue(...)` on the *same* `react-hook-form` instance Checkout
  already uses — it never changes what gets validated or submitted.
  "Enter a new address" resets to a blank form. The default address is
  pre-selected automatically on load. Order creation still snapshots
  whatever is in the form into a fresh `OrderAddress`, exactly as before —
  editing or deleting a saved `Address` later never touches a past order.

## Wishlist

Existing architecture, now actually connected: `Wishlist` (DB) and
`useStore().wishlist` (zustand, `localStorage`-persisted) both already
existed; the store was wishlist-only-client-side and the DB route was
unused by any UI. `wishlist-service.ts` now backs `/api/wishlist`
(`GET`/`POST` — unchanged endpoints, logic extracted into the service for
consistency with the other Part 7 services), and:

- `toggleWishlist` (the store action every existing component —
  `product-card.tsx`, `wishlist-button.tsx`, `wishlist-sheet.tsx` — already
  calls) now also fires a best-effort `POST /api/wishlist` in the
  background. A guest gets a `401` and keeps the exact same
  `localStorage`-only behavior as before.
- `WishlistSync` (`src/components/account/wishlist-sync.tsx`, mounted once
  in the root layout next to the existing `NotificationListener`) hydrates
  the store from the DB the moment a session becomes `authenticated`,
  **merging** with whatever was wishlisted locally as a guest rather than
  overwriting it — nothing wishlisted before signing in is lost.

No wishlist-consuming component was changed — they all still just read
`useStore().wishlist`/`isWishlisted()`, which is now DB-backed for signed-in
customers.

## Reviews

One `Review` per delivered `OrderItem` — enforced by
`@@unique([orderItemId])` at the schema level and by
`review-service.ts`'s `createReview`, which:

1. Loads the `OrderItem` and its parent `Order`'s `Shipment`.
2. Throws `ReviewNotEligibleError` unless `Shipment.status === 'DELIVERED'`
   and the order belongs to the requesting customer.
3. Throws `ReviewAlreadyExistsError` if a `Review` already exists for that
   `orderItemId`.

`GET /api/reviews/reviewable` lists every delivered order item a customer
hasn't reviewed yet — the only place `WriteReviewDialog` is ever opened
from (`ReviewableItems`, shown on the account dashboard), so the UI itself
never offers to review something ineligible, on top of the API enforcing it
for real. `GET /api/reviews?productId=` returns published reviews for a
product page (future storefront integration); `GET /api/reviews?mine=1`
returns the signed-in customer's own reviews.

## Buy Again

`GET /api/orders/[id]/buy-again` rebuilds a previous order's line items
using **current** data, never the historical order:

- For each `OrderItem`, resolves the live `Product` by id (skips/flags it
  as unavailable if soft-deleted or gone).
- Looks up a matching `ProductVariant` by `(productId, volumeMl)` — if the
  product has been migrated to the Part 6 variant system, price comes from
  `ProductVariant.price` and availability from
  `Inventory.currentStock - reservedStock > 0`.
- Falls back to the legacy `Product.volumes`/`Product.stock` fields
  otherwise (mirrors how `order-integration.ts` resolves variants for
  inventory reservation — see `src/lib/inventory/README.md`).
- Never copies `OrderItem.price` into the result except as the last-resort
  base before it's overwritten by whichever current source (variant or
  legacy) was found.

The route never creates an order — it returns a cart-ready payload.
`BuyAgainButton` (`src/components/account/buy-again-button.tsx`) pushes the
*available* items into the existing cart store via a new `addCartLine`
action (same merge-by-`productId`+`ml` logic `addToCart` already uses, just
accepting a `CartLine`-shaped payload instead of a full `Product` object —
added because Buy Again's response is already exactly that shape). Checkout
and order creation are completely unaware this happened; the customer
still goes through the same checkout flow with these items in their cart.

## Recently Viewed

Unchanged from what already existed: `useStore().recentlyViewed`
(zustand, `localStorage`-persisted, capped at 8 — see `src/lib/store.ts`,
`addRecentlyViewed`) and the `RecentlyViewed` section component. This
already satisfies the spec ("automatically record viewed products, display
the most recent, configurable maximum length" — the cap is the literal
`.slice(0, 8)` in `addRecentlyViewed`). It's client-only/per-device, not
synced to the DB like Wishlist now is; a future enhancement could add a
`RecentlyViewed` table and sync it the same way `WishlistSync` does, but
that wasn't required to satisfy the spec's verification checklist.

## Account Dashboard

`GET /api/account/dashboard` is one aggregation read (profile, last 5
orders with payment/shipment/invoice status, active shipments, saved
addresses, wishlist count, last 5 notifications + unread count) —
composes existing services and read-only queries, writes nothing. Replaces
the previous `/account` page's hardcoded mock arrays with this real data.

## Notifications

`/account/notifications` is a new dedicated page (the existing header bell
dropdown only ever showed a short recent list). Both consume the same
`notification-center` API/service; the page adds "filter by type" — mapped
onto the existing `NotificationType` enum (`PAYMENT_CONFIRMED` →
"Payment", `ORDER_PREPARING` → "Order", `SHIPMENT_UPDATE` → "Shipment",
`INVOICE_GENERATED` → "Invoice") rather than introducing a second, parallel
category system. "Promotion" is listed in the spec as future — no
`NotificationType` for it exists yet, so it isn't in the filter list
either; adding one later is a one-line enum change plus one filter entry.

## Order Detail

`GET /api/orders/[id]` (unchanged route) already returns items, address,
payment history, and shipment — see `src/lib/payment/README.md` (payment
timeline) and `src/lib/shipping/` (shipment timeline) for how those are
built. Customer notes vs. internal staff notes were already separated
before this module (`Shipment.customerNotes` vs `Shipment.internalNotes`,
with `buildCustomerShipmentView` stripping `internalNotes` for non-staff
callers) — this module doesn't change that boundary, only reuses it.

## Admin

`GET /api/admin/customers` / `GET /api/admin/customers/[id]`
(`src/app/admin/customers/`) are new, real-data staff views — profile,
order history, saved addresses (read), wishlist/review **counts** only
(never the wishlist/review contents themselves, and never an edit action)
— replacing the previous `/admin/users` page's mock data as the
"Customers" nav target. Every admin route in this module is `GET`-only:
staff can look, never modify a customer's wishlist, reviews, or saved
addresses through any Part 7 endpoint, per spec. (The old mock-data
`/admin/users` page/route are left in place, just no longer linked from
the sidebar, rather than deleted — nothing currently depends on removing
them.)

## Configuration

No new magic numbers were introduced — the existing `recentlyViewed` cap
(8, in `store.ts`) and the existing notification/shipment/payment configs
this module reads from are unchanged.

## Future (per spec, not built)

- Preferred language/currency are stored (`User.preferredLanguage`,
  `preferredCurrency`) but not yet read by any checkout/locale/pricing
  logic — the profile form has somewhere to save them for when that lands.
- Delete Account Request, View Active Sessions — explicitly future in the
  spec; no schema or endpoints added for them yet.
