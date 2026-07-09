// SettingsService — admin-configurable store settings, one key/value row
// per setting (SystemSetting). Independent of every other service; nothing
// else in the app currently reads these values (see "Future wiring" below)
// — the point of this pass is the storage + admin UI, not retrofitting every
// consumer of a currently-hardcoded constant. See src/lib/rbac/README.md,
// "System Settings".

import { db } from '@/lib/db'

export const SETTINGS_KEYS = [
  'shippingFees',
  'lowStockThreshold',
  'invoicePrefix',
  'paymentTimeoutMinutes',
  'storeInformation',
  'businessHours',
] as const

export type SettingsKey = (typeof SETTINGS_KEYS)[number]

export const DEFAULT_SETTINGS: Record<SettingsKey, unknown> = {
  shippingFees: { localCourier: 2, logistics: 5 },
  lowStockThreshold: 5,
  invoicePrefix: 'INV',
  paymentTimeoutMinutes: 15,
  storeInformation: { name: 'The Scent Lab', email: 'support@thescentlab.com', phone: '', address: '' },
  businessHours: { open: '09:00', close: '18:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] },
}

export async function getAllSettings(): Promise<Record<SettingsKey, unknown>> {
  const rows = await db.systemSetting.findMany()
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return { ...DEFAULT_SETTINGS, ...byKey } as Record<SettingsKey, unknown>
}

export async function getSetting(key: SettingsKey): Promise<unknown> {
  const row = await db.systemSetting.findUnique({ where: { key } })
  return row ? row.value : DEFAULT_SETTINGS[key]
}

export async function updateSetting(key: SettingsKey, value: unknown, updatedById: string) {
  return db.systemSetting.upsert({
    where: { key },
    update: { value: value as never, updatedById },
    create: { key, value: value as never, updatedById },
  })
}
