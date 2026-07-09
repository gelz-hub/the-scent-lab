// Central configuration for the address/map system. Every tunable value lives
// here — nothing checkout- or map-related should hardcode these elsewhere.
// All values are NEXT_PUBLIC_ since they're read by client components/hooks
// (the Geoapify API key is the one exception — that stays server-only, see
// src/lib/maps/providers/geoapify-provider.ts).

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function envString(name: string, fallback: string): string {
  return process.env[name] || fallback
}

export const mapConfig = {
  /** Map center used when no address/coordinates are set yet (Phnom Penh). */
  defaultCenter: {
    lat: envNumber('NEXT_PUBLIC_MAP_DEFAULT_LAT', 11.5564),
    lng: envNumber('NEXT_PUBLIC_MAP_DEFAULT_LNG', 104.9282),
  },
  /** Zoom level when centered on the default location (no pin placed). */
  defaultZoom: envNumber('NEXT_PUBLIC_MAP_DEFAULT_ZOOM', 12),
  /** Zoom level once a pin is placed. */
  pinZoom: envNumber('NEXT_PUBLIC_MAP_PIN_ZOOM', 16),
  tileUrl: envString(
    'NEXT_PUBLIC_MAP_TILE_URL',
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  ),
  tileAttribution: envString(
    'NEXT_PUBLIC_MAP_TILE_ATTRIBUTION',
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  ),
} as const

export const addressSearchConfig = {
  minChars: envNumber('NEXT_PUBLIC_ADDRESS_SEARCH_MIN_CHARS', 3),
  debounceMs: envNumber('NEXT_PUBLIC_ADDRESS_SEARCH_DEBOUNCE_MS', 350),
  cacheTtlMs: envNumber('NEXT_PUBLIC_ADDRESS_SEARCH_CACHE_TTL_MS', 5 * 60 * 1000),
} as const
