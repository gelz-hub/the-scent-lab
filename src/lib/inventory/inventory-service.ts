// InventoryService — the only thing that writes to Inventory and
// InventoryMovement. Never touches Product/Order/Payment/Shipment directly;
// order-integration.ts is the orchestration layer that calls this service
// from the checkout/payment/shipment lifecycle (see src/lib/inventory/README.md
// for the same independence boundary already used by PaymentService).

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import type { InventoryMovementType, PrismaClient } from '@prisma/client'
import { LOW_STOCK_THRESHOLD, type ManualAdjustmentType } from './config'

export class InsufficientStockError extends Error {
  constructor(message = 'Not enough stock available.') {
    super(message)
    this.name = 'InsufficientStockError'
  }
}

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

interface InventoryRow {
  currentStock: number
  reservedStock: number
  safetyStock: number
  reorderLevel: number
}

/**
 * Locks the Inventory row for the duration of the enclosing transaction
 * (`SELECT ... FOR UPDATE`) — a concurrent reserve/release/commit/adjust for
 * the SAME variant blocks (queues) on this row lock rather than racing and
 * failing. This is the standard, correct pattern for "never oversell" under
 * concurrency: MySQL serializes writers itself, so there's no optimistic
 * retry loop that can spuriously exhaust its attempt budget under heavy
 * contention (verified against a 20-concurrent-request smoke test — see
 * src/lib/inventory/README.md, "Concurrency safety").
 */
async function lockInventoryRow(tx: Tx, variantId: string): Promise<InventoryRow | null> {
  const rows = await tx.$queryRaw<InventoryRow[]>(
    Prisma.sql`SELECT currentStock, reservedStock, safetyStock, reorderLevel FROM Inventory WHERE variantId = ${variantId} FOR UPDATE`
  )
  return rows[0] ?? null
}

async function recordMovement(
  tx: Tx,
  variantId: string,
  type: InventoryMovementType,
  quantity: number,
  previousStock: number,
  newStock: number,
  options: { reason?: string; referenceId?: string; createdById?: string } = {}
) {
  await tx.inventoryMovement.create({
    data: {
      variantId,
      type,
      quantity,
      previousStock,
      newStock,
      reason: options.reason,
      referenceId: options.referenceId,
      createdById: options.createdById,
    },
  })
}

export interface InventorySnapshot {
  variantId: string
  currentStock: number
  reservedStock: number
  availableStock: number
  safetyStock: number
  reorderLevel: number
  isLowStock: boolean
}

function toSnapshot(inv: { variantId: string; currentStock: number; reservedStock: number; safetyStock: number; reorderLevel: number }): InventorySnapshot {
  const availableStock = inv.currentStock - inv.reservedStock
  const threshold = Math.max(inv.reorderLevel, inv.safetyStock, LOW_STOCK_THRESHOLD)
  return {
    variantId: inv.variantId,
    currentStock: inv.currentStock,
    reservedStock: inv.reservedStock,
    availableStock,
    safetyStock: inv.safetyStock,
    reorderLevel: inv.reorderLevel,
    isLowStock: availableStock <= threshold,
  }
}

export async function getInventory(variantId: string): Promise<InventorySnapshot | null> {
  const inv = await db.inventory.findUnique({ where: { variantId } })
  return inv ? toSnapshot(inv) : null
}

/** Ensures a variant has an Inventory row (created lazily at zero stock the first time it's touched). */
export async function ensureInventory(variantId: string) {
  return db.inventory.upsert({
    where: { variantId },
    update: {},
    create: { variantId },
  })
}

export async function listLowStock(): Promise<InventorySnapshot[]> {
  const all = await db.inventory.findMany({ include: { variant: { include: { product: true } } } })
  return all.map(toSnapshot).filter((s) => s.isLowStock)
}

export async function getMovementHistory(variantId: string) {
  return db.inventoryMovement.findMany({
    where: { variantId },
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { name: true } } },
  })
}

/**
 * Manual, staff-initiated stock change (PURCHASE/RETURN/ADJUSTMENT/DAMAGE/
 * TRANSFER) — `quantity` is the signed delta to apply to currentStock
 * (positive for incoming, negative for outgoing). Records the full audit
 * (previous/new/difference/staff/reason/timestamp) as one InventoryMovement
 * row. Never lets currentStock go negative.
 */
export async function adjustStock(input: {
  variantId: string
  type: ManualAdjustmentType
  quantity: number
  reason: string
  staffUserId: string
}): Promise<InventorySnapshot> {
  const { variantId, type, quantity, reason, staffUserId } = input
  if (quantity === 0) throw new Error('Adjustment quantity cannot be zero.')

  await ensureInventory(variantId)

  return db.$transaction(async (tx) => {
    const row = await lockInventoryRow(tx, variantId)
    if (!row) throw new Error('Inventory row not found.')

    const newStock = row.currentStock + quantity
    if (newStock < 0) {
      throw new InsufficientStockError(
        `Cannot reduce stock by ${Math.abs(quantity)} — only ${row.currentStock} in stock.`
      )
    }

    await tx.inventory.update({ where: { variantId }, data: { currentStock: newStock } })
    await recordMovement(tx, variantId, type, quantity, row.currentStock, newStock, { reason, createdById: staffUserId })

    return toSnapshot({ variantId, ...row, currentStock: newStock })
  })
}

/**
 * Reserves stock for a paid-but-unshipped order line — moves stock from
 * "available" to "reserved" without changing currentStock. Concurrency-safe
 * via a row lock (see lockInventoryRow): two concurrent reservations for the
 * same variant are serialized by MySQL itself, so neither can ever both
 * succeed against the same last unit of available stock, and neither fails
 * spuriously just because it had to wait its turn.
 */
export async function reserveStock(
  variantId: string,
  quantity: number,
  referenceId: string
): Promise<InventorySnapshot> {
  if (quantity <= 0) throw new Error('Reservation quantity must be positive.')
  await ensureInventory(variantId)

  return db.$transaction(async (tx) => {
    const row = await lockInventoryRow(tx, variantId)
    if (!row) throw new Error('Inventory row not found.')

    const available = row.currentStock - row.reservedStock
    if (available < quantity) {
      throw new InsufficientStockError(`Only ${available} unit(s) available — cannot reserve ${quantity}.`)
    }

    const newReserved = row.reservedStock + quantity
    await tx.inventory.update({ where: { variantId }, data: { reservedStock: newReserved } })
    await recordMovement(tx, variantId, 'RESERVATION', quantity, row.reservedStock, newReserved, { referenceId })

    return toSnapshot({ variantId, ...row, reservedStock: newReserved })
  })
}

/**
 * Releases a previously reserved quantity back to available stock (order
 * cancelled/failed before shipment). Idempotent per referenceId+variant —
 * callers should check hasMovement(variantId, referenceId, 'RESERVATION_RELEASE')
 * first (see order-integration.ts) so a release triggered from two different
 * event sources (order cancel + shipment cancel) never double-releases.
 */
export async function releaseReservedStock(
  variantId: string,
  quantity: number,
  referenceId: string
): Promise<InventorySnapshot> {
  if (quantity <= 0) throw new Error('Release quantity must be positive.')

  return db.$transaction(async (tx) => {
    const row = await lockInventoryRow(tx, variantId)
    if (!row) throw new Error('Inventory row not found.')

    const newReserved = Math.max(0, row.reservedStock - quantity)
    await tx.inventory.update({ where: { variantId }, data: { reservedStock: newReserved } })
    await recordMovement(tx, variantId, 'RESERVATION_RELEASE', quantity, row.reservedStock, newReserved, { referenceId })

    return toSnapshot({ variantId, ...row, reservedStock: newReserved })
  })
}

/**
 * Permanently reduces stock at shipment time — decrements both
 * currentStock and reservedStock by the same quantity (the reservation is
 * being fulfilled, not just released). This is the only path that
 * permanently removes stock for a sale.
 */
export async function commitReservedStock(
  variantId: string,
  quantity: number,
  referenceId: string
): Promise<InventorySnapshot> {
  if (quantity <= 0) throw new Error('Commit quantity must be positive.')

  return db.$transaction(async (tx) => {
    const row = await lockInventoryRow(tx, variantId)
    if (!row) throw new Error('Inventory row not found.')

    const newCurrent = row.currentStock - quantity
    if (newCurrent < 0) {
      throw new InsufficientStockError(`Cannot ship ${quantity} unit(s) — only ${row.currentStock} in stock.`)
    }
    const newReserved = Math.max(0, row.reservedStock - quantity)

    await tx.inventory.update({ where: { variantId }, data: { currentStock: newCurrent, reservedStock: newReserved } })
    await recordMovement(tx, variantId, 'SALE', -quantity, row.currentStock, newCurrent, { referenceId })

    return toSnapshot({ variantId, ...row, currentStock: newCurrent, reservedStock: newReserved })
  })
}

/** True if a movement of this type already exists for this variant+referenceId — the idempotency check order-integration.ts uses before reserving/releasing/committing. */
export async function hasMovement(variantId: string, referenceId: string, type: InventoryMovementType): Promise<boolean> {
  const existing = await db.inventoryMovement.findFirst({ where: { variantId, referenceId, type } })
  return Boolean(existing)
}
