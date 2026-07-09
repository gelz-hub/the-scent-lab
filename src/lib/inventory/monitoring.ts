// Structured, greppable logging for inventory operations — mirrors
// src/lib/payment/monitoring.ts. Never surfaced to customers.

type InventoryLogEvent =
  | 'reservation_insufficient_stock'
  | 'reservation_failed'
  | 'commit_failed'
  | 'release_failed'
  | 'low_stock_detected'

interface InventoryLogContext {
  orderId?: string
  variantId?: string
  productId?: string
  qty?: number
  error?: unknown
  [key: string]: unknown
}

export function logInventoryEvent(event: InventoryLogEvent, context: InventoryLogContext = {}) {
  const { error, ...rest } = context
  const entry = {
    scope: 'inventory',
    event,
    ...rest,
    ...(error !== undefined && { error: error instanceof Error ? error.message : String(error) }),
    timestamp: new Date().toISOString(),
  }

  if (event.endsWith('_failed')) {
    console.error('[inventory]', JSON.stringify(entry))
  } else {
    console.warn('[inventory]', JSON.stringify(entry))
  }
}
