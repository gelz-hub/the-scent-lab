import provincesData from '@/data/cambodia/provinces.json'
import districtsData from '@/data/cambodia/districts.json'

// Both files are versioned, replaceable data sources (see src/lib/maps/README.md
// for how to swap in an official dataset) — this module is the only place
// that knows their on-disk shape; everything else just calls these exports.

export const CAMBODIA_PROVINCES = provincesData.data.map((p) => p.name) as string[]

export type Province = (typeof CAMBODIA_PROVINCES)[number]

const DISTRICTS_BY_PROVINCE = districtsData.data as Record<string, string[]>

/** Returns the known district list for a province, or [] if we have no data for it (falls back to free text in the UI). */
export function districtsFor(province: string): string[] {
  return DISTRICTS_BY_PROVINCE[province] ?? []
}
