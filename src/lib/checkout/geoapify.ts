// Compatibility surface for the API routes — the actual provider logic lives
// behind the provider abstraction in @/lib/maps/providers so it can be
// swapped without touching checkout code. See src/lib/maps/README.md.

import { getGeocodingProvider } from '@/lib/maps/providers'
import type { ResolvedAddress, AddressSuggestion } from '@/lib/maps/types'

export type { ResolvedAddress, AddressSuggestion }

export async function reverseGeocode(lat: number, lon: number): Promise<ResolvedAddress | null> {
  return getGeocodingProvider().reverseGeocode(lat, lon)
}

export async function searchAddress(query: string): Promise<AddressSuggestion[]> {
  return getGeocodingProvider().searchAddress(query)
}
