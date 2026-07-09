import type { ResolvedAddress, AddressSuggestion } from '@/lib/maps/types'

/**
 * Everything checkout/map UI needs from a geocoding backend. Implement this
 * once for a new provider (Mapbox, Google, HERE, ...) and swap it in via
 * getGeocodingProvider() — no checkout or map component ever imports a
 * provider SDK directly.
 */
export interface GeocodingProvider {
  readonly name: string
  reverseGeocode(lat: number, lon: number): Promise<ResolvedAddress | null>
  searchAddress(query: string): Promise<AddressSuggestion[]>
}
