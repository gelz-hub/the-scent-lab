// Order <-> Inventory orchestration — the ONLY place that connects
// OrderItem/Order lifecycle events to InventoryService. Mirrors the
// PaymentService/orchestrate-verification.ts split: InventoryService never
// knows about Order/Payment/Shipment, and this file never writes to
// Inventory/InventoryMovement directly — it only calls InventoryService.
//
// Called from (all additive hooks into existing, unmodified flows — see
// src/lib/inventory/README.md, "Order Integration"):
//   - src/lib/payment/orchestrate-verification.ts, after a payment is
//     newly observed PAID  -> reserveStockForOrder
//   - src/app/api/shipments/[id]/route.ts, on transition to SHIPPED
//     -> commitStockForOrder
//   - src/app/api/shipments/[id]/route.ts, on transition to CANCELLED/RETURNED,
//     and src/app/api/orders/[id]/route.ts, on order status -> CANCELLED
//     -> releaseStockForOrder

import { db } from '@/lib/db'
import { reserveStock, releaseReservedStock, commitReservedStock, hasMovement, InsufficientStockError } from './inventory-service'
import { logInventoryEvent } from './monitoring'

interface OrderItemLike {
  productId: string
  ml: number
  qty: number
}

/**
 * An order line item only carries productId + ml (see OrderItem — checkout
 * never changed to reference a variant id directly). Resolves that back to
 * the ProductVariant actually tracking inventory. Returns null (not an
 * error) if no matching variant exists yet — lets products without
 * inventory set up still complete checkout/payment/shipment untouched,
 * exactly as they did before this module existed.
 */
async function resolveVariant(item: OrderItemLike) {
  return db.productVariant.findFirst({ where: { productId: item.productId, volumeMl: item.ml } })
}

/** After payment is confirmed (PAID): reserve stock for every line item. Best-effort — a resolution/stock failure is logged, never thrown, so it can never break the payment-verification flow it's called from. */
export async function reserveStockForOrder(orderId: string): Promise<void> {
  const items = await db.orderItem.findMany({ where: { orderId } })

  for (const item of items) {
    try {
      const variant = await resolveVariant(item)
      if (!variant) continue // no inventory tracking configured for this product/size yet

      if (await hasMovement(variant.id, orderId, 'RESERVATION')) continue // already reserved for this order (idempotent)

      await reserveStock(variant.id, item.qty, orderId)
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        logInventoryEvent('reservation_insufficient_stock', { orderId, productId: item.productId, qty: item.qty, error })
      } else {
        logInventoryEvent('reservation_failed', { orderId, productId: item.productId, qty: item.qty, error })
      }
      // Deliberately not re-thrown: an inventory shortfall must never corrupt
      // or roll back a confirmed payment. Out-of-stock handling for an
      // already-paid order is a staff/fulfillment concern (see README),
      // not something that unwinds the payment/invoice/notification flow.
    }
  }
}

/** After shipment (SHIPPED): permanently commit (reduce) stock for every line item. Best-effort, idempotent, never throws into the shipment status-update flow. */
export async function commitStockForOrder(orderId: string): Promise<void> {
  const items = await db.orderItem.findMany({ where: { orderId } })

  for (const item of items) {
    try {
      const variant = await resolveVariant(item)
      if (!variant) continue

      if (await hasMovement(variant.id, orderId, 'SALE')) continue // already committed (idempotent)

      // Works whether or not this order's stock was ever reserved —
      // commitReservedStock floors reservedStock at 0, so a variant whose
      // inventory tracking was only configured after the order was paid
      // still gets its sale committed correctly.
      await commitReservedStock(variant.id, item.qty, orderId)
    } catch (error) {
      logInventoryEvent('commit_failed', { orderId, productId: item.productId, qty: item.qty, error })
    }
  }
}

/** Order cancelled/failed before shipment: release any reserved stock. Best-effort, idempotent (checks for an existing RELEASE or SALE before acting), never throws into the caller's status-update flow. */
export async function releaseStockForOrder(orderId: string): Promise<void> {
  const items = await db.orderItem.findMany({ where: { orderId } })

  for (const item of items) {
    try {
      const variant = await resolveVariant(item)
      if (!variant) continue

      const alreadyReleased = await hasMovement(variant.id, orderId, 'RESERVATION_RELEASE')
      const alreadyCommitted = await hasMovement(variant.id, orderId, 'SALE')
      if (alreadyReleased || alreadyCommitted) continue // idempotent: nothing left to release either way

      const wasReserved = await hasMovement(variant.id, orderId, 'RESERVATION')
      if (!wasReserved) continue // nothing was ever reserved for this order

      await releaseReservedStock(variant.id, item.qty, orderId)
    } catch (error) {
      logInventoryEvent('release_failed', { orderId, productId: item.productId, qty: item.qty, error })
    }
  }
}
