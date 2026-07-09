import { CAMBODIA_PROVINCES } from '@/lib/maps/constants/provinces'
import { normalizeProvinceName, normalizeDistrictName } from '@/lib/maps/constants/normalization'
import { addressSearchConfig } from '@/lib/maps/config'
import { logGeoFailure } from '@/lib/maps/logger'
import type { ResolvedAddress, AddressSuggestion } from '@/lib/maps/types'
import type { GeocodingProvider } from './types'

const PROVIDER_NAME = 'geoapify'

/** Best-effort match of a free-text region name onto our fixed province list. */
function matchProvince(raw: string | undefined): string {
  if (!raw) return ''
  const normalized = normalizeProvinceName(raw).toLowerCase()
  const match = CAMBODIA_PROVINCES.find(
    (p) => p.toLowerCase() === normalized || normalized.includes(p.toLowerCase())
  )
  return match || normalizeProvinceName(raw)
}

function matchDistrict(raw: string | undefined): string {
  if (!raw) return ''
  return normalizeDistrictName(raw)
}

function extractFromGeoapifyResult(result: {
  properties: Record<string, unknown>
}): ResolvedAddress {
  const p = result.properties as {
    state?: string
    county?: string
    city?: string
    suburb?: string
    district?: string
    quarter?: string
    village?: string
    street?: string
    housenumber?: string
    postcode?: string
    lat: number
    lon: number
    formatted: string
  }

  const streetParts = [p.housenumber, p.street].filter(Boolean)

  return {
    province: matchProvince(p.state || p.city),
    district: matchDistrict(p.county || p.city || p.suburb),
    commune: p.district || p.quarter || '',
    village: p.village || p.suburb || '',
    streetAddress: streetParts.join(' ') || p.formatted || '',
    postalCode: p.postcode || '',
    latitude: p.lat,
    longitude: p.lon,
    formatted: p.formatted,
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<ResolvedAddress | null> {
  const apiKey = process.env.GEOAPIFY_API_KEY
  if (!apiKey) {
    logGeoFailure('GEOAPIFY_API_KEY is not configured', { provider: PROVIDER_NAME, operation: 'reverseGeocode', lat, lon })
    return null
  }

  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&format=geojson&apiKey=${apiKey}`

  let res: Response
  try {
    res = await fetch(url)
  } catch (error) {
    logGeoFailure('network error calling Geoapify', { provider: PROVIDER_NAME, operation: 'reverseGeocode', lat, lon }, error)
    return null
  }

  if (!res.ok) {
    logGeoFailure(`Geoapify returned ${res.status}`, { provider: PROVIDER_NAME, operation: 'reverseGeocode', lat, lon, status: res.status })
    return null
  }

  const data = await res.json()
  const feature = data.features?.[0]
  if (!feature) {
    logGeoFailure('no features in Geoapify response', { provider: PROVIDER_NAME, operation: 'reverseGeocode', lat, lon })
    return null
  }

  return extractFromGeoapifyResult(feature)
}

async function searchAddress(query: string): Promise<AddressSuggestion[]> {
  const apiKey = process.env.GEOAPIFY_API_KEY
  if (!apiKey) {
    logGeoFailure('GEOAPIFY_API_KEY is not configured', { provider: PROVIDER_NAME, operation: 'searchAddress', query })
    return []
  }
  if (query.trim().length < addressSearchConfig.minChars) return []

  // Bias results to Cambodia and its approximate bounding box.
  const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
    query
  )}&filter=countrycode:kh&bias=countrycode:kh&limit=6&format=geojson&apiKey=${apiKey}`

  let res: Response
  try {
    res = await fetch(url)
  } catch (error) {
    logGeoFailure('network error calling Geoapify', { provider: PROVIDER_NAME, operation: 'searchAddress', query }, error)
    return []
  }

  if (!res.ok) {
    logGeoFailure(`Geoapify returned ${res.status}`, { provider: PROVIDER_NAME, operation: 'searchAddress', query, status: res.status })
    return []
  }

  const data = await res.json()
  const features = (data.features || []) as { properties: Record<string, unknown> }[]

  return features.map((f) => {
    const resolved = extractFromGeoapifyResult(f)
    return {
      formatted: resolved.formatted,
      province: resolved.province,
      district: resolved.district,
      streetAddress: resolved.streetAddress,
      latitude: resolved.latitude,
      longitude: resolved.longitude,
    }
  })
}

export const geoapifyProvider: GeocodingProvider = {
  name: PROVIDER_NAME,
  reverseGeocode,
  searchAddress,
}
