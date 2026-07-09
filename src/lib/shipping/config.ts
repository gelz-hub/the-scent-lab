// Centralized shipping fee configuration. Every fee/threshold in the app
// reads from here — never hardcode a shipping number anywhere else.
// Env-overridable (NEXT_PUBLIC_ since fees are computed both client-side
// for the checkout estimate and server-side when the order is created).

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const SHIPPING_FEES = {
  LOCAL_COURIER: {
    baseFee: envNumber('NEXT_PUBLIC_SHIPPING_LOCAL_COURIER_FEE', 2),
    freeShippingThreshold: envNumber('NEXT_PUBLIC_SHIPPING_LOCAL_COURIER_FREE_THRESHOLD', 100),
  },
  LOGISTICS: {
    // Flat rate regardless of which courier staff ends up assigning —
    // customers never choose (or pay differently for) J&T vs Vireak Buntham.
    baseFee: envNumber('NEXT_PUBLIC_SHIPPING_LOGISTICS_FEE', 2.5),
  },
} as const

export const DEFAULT_ESTIMATED_DELIVERY = {
  LOCAL_COURIER: 'Same Day (2–6 Hours)',
  LOGISTICS: '1–3 Business Days',
} as const
