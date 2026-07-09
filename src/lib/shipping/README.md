# Cambodia Delivery & Shipping System

Fulfillment/logistics for The Scent Lab, deliberately modeled as a domain
separate from `Order`. `Order` is the financial/customer-facing record
(subtotal, discount, shippingFee snapshot, payment); `Shipment` is the
staff-operated record of how the parcel actually moves.

## Folder structure

```
src/lib/shipping/
  config.ts        SHIPPING_FEES, DEFAULT_ESTIMATED_DELIVERY — env-overridable, never hardcode a fee elsewhere
  constants.ts      SHIPPING_STATUSES, CUSTOMER_FACING_SHIPPING_STATUSES
  couriers.ts       Courier metadata (id, displayName, description, logo, trackingWebsite) — the ONLY place courier display strings live
  transitions.ts    ALLOWED_SHIPPING_TRANSITIONS — the status state machine, enforced server-side
  timeline.ts       buildShipmentTimeline() — merges Order + Shipment into one customer-friendly sequence

src/app/api/shipments/
  route.ts               GET (staff list, excludes archived) · POST (retry-create for an order missing a shipment)
  [id]/route.ts           GET (staff: full detail · customer: safe projection) · PATCH (staff updates) · DELETE (soft-archive)
  [id]/timeline/route.ts  GET — the reusable timeline projection

src/components/admin/shipment-edit-dialog.tsx   Staff editor: status, courier, tracking, fee, notes, history
src/app/admin/shipments/                        Admin shipments list page
```

## Shipment lifecycle

```
PENDING → PREPARING → READY_FOR_SHIPMENT → SHIPPED → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
```

Branches: `FAILED_DELIVERY` can be retried (`OUT_FOR_DELIVERY`), sent back
(`RETURNED`), or cancelled. Most non-terminal states can move to `CANCELLED`.
`DELIVERED`, `RETURNED`, and `CANCELLED` are terminal — nothing transitions
out of them.

**Every transition is validated server-side** in `PATCH /api/shipments/[id]`
via `isValidShippingTransition()` (`transitions.ts`). Invalid requests (e.g.
`DELIVERED → PREPARING`) are rejected with a 400 before touching the
database. The full table lives in `ALLOWED_SHIPPING_TRANSITIONS` — edit it
there, not inline in the route, if the lifecycle needs to change.

**Courier assignment gate**: a `LOGISTICS` shipment cannot move to `SHIPPED`
unless it already has both a `deliveryCompany` and a `trackingNumber` (either
already on the record or being set in the same request). Enforced in the same
route, before the transition check's side effects run.

Every status change writes an **append-only** `ShipmentStatusEvent`
(status, optional note, actor, timestamp) — history is never edited or
deleted, only added to.

## Courier change workflow

The customer picks a courier (J&T Express or Vireak Buntham Express) at
checkout — that choice is written to both `OrderAddress.deliveryCompany` (what
they picked) and `Shipment.deliveryCompany` (what fulfillment will use).

If staff need to override it, `PATCH /api/shipments/[id]` requires a
`courierChangeReason` whenever `deliveryCompany` differs from the current
value — the request is rejected with `"Please provide a reason for changing
the courier."` otherwise. A successful change writes a permanent
`ShipmentCourierChange` row: `previousCourier`, `newCourier`, `reason`,
`changedBy`, `createdAt`. This is never shown to the customer.

## Audit models

| Model | Purpose | Mutability |
|---|---|---|
| `ShipmentStatusEvent` | One row per status transition | Append-only |
| `ShipmentCourierChange` | One row per staff override of the customer's courier choice | Append-only |

Both are `@relation`'d to `Shipment` with `onDelete: Cascade` — they only
disappear if the shipment row itself is (which it never is; see Soft delete).

## Notes: customer vs. internal

`Shipment` has two separate text fields:
- `customerNotes` — staff-authored, shown to the customer (e.g. "delayed due
  to weather — new estimate tomorrow"). Returned by the customer-facing
  branch of `GET /api/shipments/[id]`.
- `internalNotes` — staff-only, never returned to a non-staff caller.

This is distinct from `OrderAddress.deliveryNote`, which is the customer's
own delivery instructions ("near AEON Mall", "call before arrival") captured
at checkout — always visible to staff, never editable by staff.

## Soft delete

Shipments are never physically deleted. `DELETE /api/shipments/[id]` sets
`archivedAt` and `status: CANCELLED` (logging a `ShipmentStatusEvent` for the
cancellation) instead of removing the row. `GET /api/shipments` excludes
archived shipments by default (`where: { archivedAt: null }`) so the admin
list stays clean, but the data — and its full audit trail — remains in the
database permanently.

## Timeline API

`GET /api/shipments/[id]/timeline` returns a flat, chronological array:

```json
[
  { "status": "Order Placed", "createdAt": "2026-01-01T02:00:00.000Z" },
  { "status": "Payment Confirmed", "createdAt": "2026-01-01T02:01:00.000Z" },
  { "status": "Preparing", "createdAt": "2026-01-01T04:00:00.000Z" },
  { "status": "Shipped", "createdAt": "2026-01-01T09:00:00.000Z" }
]
```

Built by `buildShipmentTimeline()` in `timeline.ts`, which merges
`Order.createdAt` ("Order Placed"), `Payment.updatedAt` when
`status === 'PAID'` ("Payment Confirmed"), and every `ShipmentStatusEvent` —
filtered to `CUSTOMER_FACING_SHIPPING_STATUSES` for non-staff callers, full
detail for staff. `Order` and `Shipment` remain separate models; this
endpoint is purely a read-side projection that merges them for display. No UI
consumes it yet — it's ready for whichever order-tracking page needs it next.

## Delivery fee configuration

`src/lib/shipping/config.ts`:

```ts
SHIPPING_FEES = {
  LOCAL_COURIER: { baseFee, freeShippingThreshold },
  LOGISTICS: { baseFee }, // flat, regardless of which courier is assigned
}
```

Env-overridable (`NEXT_PUBLIC_SHIPPING_LOCAL_COURIER_FEE`,
`NEXT_PUBLIC_SHIPPING_LOCAL_COURIER_FREE_THRESHOLD`,
`NEXT_PUBLIC_SHIPPING_LOGISTICS_FEE`) so a price change is a config/env edit,
never a code change. `Order.shippingFee` and `Shipment.shippingFee` both
snapshot the fee **at the moment the order was placed** — changing the config
afterward never alters historical orders.

## Courier metadata

`src/lib/shipping/couriers.ts` is the only place a courier's display name,
description, logo, or tracking-site URL is defined. The database only ever
stores the stable id (`DeliveryCompany` enum: `JT_EXPRESS` | `VIREAK_BUNTHAM`).
Renaming a provider, swapping their logo, or adding a new courier is a change
to this one file — no migration, no touching checkout or admin components.

To add a new courier: add an entry to `COURIERS` in `couriers.ts`, add the
value to the `DeliveryCompany` Prisma enum, `prisma db push`. Every consumer
(`LOGISTICS_COMPANIES` in `checkout/constants.ts`, the checkout selector, the
admin dialog) reads from `couriers.ts` and picks it up automatically.

## Future integrations

Designed to not require a redesign for:
- **Additional couriers** — add to `couriers.ts` + the Prisma enum (see above).
- **Store pickup / express / scheduled delivery** — new `DeliveryMethod` enum
  values + a config entry in `SHIPPING_FEES`; `resolveDeliveryMethod()`
  (`checkout/delivery.ts`) is the single place method-selection logic lives.
- **International shipping** — the province-based `resolveDeliveryMethod()`
  assumes Cambodia today; a country field on `OrderAddress` (already present)
  plus a new resolver branch is the extension point.
- **Courier API integrations / automatic tracking** — `Shipment.trackingUrl`
  and `trackingNumber` are already free-text; a webhook handler could call
  `PATCH /api/shipments/[id]` the same way staff do, respecting the same
  transition/courier-assignment validation.
- **Real-time tracking** — the timeline API's shape is intentionally
  webhook/polling-friendly; a live-tracking UI would consume
  `GET /api/shipments/[id]/timeline` the same way a static one would.
- **Notification channels beyond Firebase push** — `src/lib/notifications.ts`
  already isolates "who to notify and why" from "how the push is sent" via
  `getAdminMessaging()`; adding email/Telegram/SMS means adding a sender
  function there, not touching shipment code.
