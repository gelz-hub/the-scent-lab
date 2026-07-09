// Centralized courier metadata. The database only ever stores the stable id
// (DeliveryCompany enum: JT_EXPRESS | VIREAK_BUNTHAM) — everything
// display-related (name, description, logo, tracking site) is looked up from
// here, so renaming a provider or adding a new one never touches the schema
// or historical order data.

export interface CourierConfig {
  id: 'JT_EXPRESS' | 'VIREAK_BUNTHAM'
  displayName: string
  description: string
  estimatedDelivery: string
  trackingWebsite: string
  /** Path under /public, or null until real brand assets are supplied. */
  logo: string | null
  enabled: boolean
}

export const COURIERS: Record<CourierConfig['id'], CourierConfig> = {
  JT_EXPRESS: {
    id: 'JT_EXPRESS',
    displayName: 'J&T Express',
    description: 'Standard nationwide delivery',
    estimatedDelivery: '1–3 Business Days',
    trackingWebsite: 'https://www.jtexpress.co.kh/index/query/gzquery.html',
    logo: null,
    enabled: true,
  },
  VIREAK_BUNTHAM: {
    id: 'VIREAK_BUNTHAM',
    displayName: 'Vireak Buntham Express',
    description: 'Nationwide delivery',
    estimatedDelivery: '1–3 Business Days',
    trackingWebsite: 'https://www.vireakbuntham.com.kh',
    logo: null,
    enabled: true,
  },
}

export const COURIER_LIST: CourierConfig[] = Object.values(COURIERS)
export const ENABLED_COURIERS: CourierConfig[] = COURIER_LIST.filter((c) => c.enabled)

export function getCourier(id: string | null | undefined): CourierConfig | null {
  if (!id) return null
  return COURIERS[id as CourierConfig['id']] ?? null
}

export function courierDisplayName(id: string | null | undefined): string {
  return getCourier(id)?.displayName ?? 'Unassigned'
}
