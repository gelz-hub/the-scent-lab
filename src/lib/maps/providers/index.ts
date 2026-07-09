import type { GeocodingProvider } from './types'
import { geoapifyProvider } from './geoapify-provider'

export type { GeocodingProvider }

/**
 * Single switch point for the active geocoding provider. To integrate a new
 * one (Mapbox, Google, HERE, ...): implement GeocodingProvider in a sibling
 * file (see geoapify-provider.ts for the shape), then return it here —
 * behind an env var if you want it configurable. No checkout/map component
 * or API route needs to change.
 */
export function getGeocodingProvider(): GeocodingProvider {
  return geoapifyProvider
}
