// Centralized Product & Inventory configuration — no magic numbers elsewhere.

/** A variant is "low stock" once available stock (current - reserved) falls to or below this, unless it has its own reorderLevel/safetyStock set higher. */
export const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD) || 5

export const SUPPORTED_CURRENCIES = ['USD', 'KHR'] as const
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]
export const DEFAULT_CURRENCY: SupportedCurrency = 'USD'

export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED'] as const
export type ProductStatusValue = (typeof PRODUCT_STATUSES)[number]

export const PRODUCT_VISIBILITIES = ['PUBLIC', 'PRIVATE', 'HIDDEN'] as const
export type ProductVisibilityValue = (typeof PRODUCT_VISIBILITIES)[number]

export const INVENTORY_MOVEMENT_TYPES = [
  'PURCHASE',
  'SALE',
  'RETURN',
  'ADJUSTMENT',
  'DAMAGE',
  'TRANSFER',
  'RESERVATION',
  'RESERVATION_RELEASE',
] as const
export type InventoryMovementTypeValue = (typeof INVENTORY_MOVEMENT_TYPES)[number]

/** Movement types a staff member can record directly via a manual adjustment (never RESERVATION/RESERVATION_RELEASE/SALE — those are only ever written by the order-integration flow, see order-integration.ts). */
export const MANUAL_ADJUSTMENT_TYPES = ['PURCHASE', 'RETURN', 'ADJUSTMENT', 'DAMAGE', 'TRANSFER'] as const
export type ManualAdjustmentType = (typeof MANUAL_ADJUSTMENT_TYPES)[number]

/** Movement types that increase currentStock. */
export const INCREASING_MOVEMENT_TYPES: InventoryMovementTypeValue[] = ['PURCHASE', 'RETURN']
/** Movement types that decrease currentStock. */
export const DECREASING_MOVEMENT_TYPES: InventoryMovementTypeValue[] = ['SALE', 'DAMAGE', 'TRANSFER']

export function productStatusLabel(status: string): string {
  return status
    .split('_')
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(' ')
}
