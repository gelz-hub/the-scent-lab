'use client'

import * as React from 'react'
import { reverseGeocode } from '@/lib/maps/services/geoapify'
import type { ResolvedAddress } from '@/lib/maps/types'

interface UseReverseGeocodeResult {
  loading: boolean
  error: string | null
  resolve: (lat: number, lon: number) => Promise<ResolvedAddress | null>
}

/** Shared reverse-geocode-on-coordinate-change logic with loading/error state, used by map drag/click/search-select. */
export function useReverseGeocode(): UseReverseGeocodeResult {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const resolve = React.useCallback(async (lat: number, lon: number) => {
    setLoading(true)
    setError(null)
    try {
      const address = await reverseGeocode(lat, lon)
      if (!address) {
        setError("We couldn't detect an address for this location. Please fill it in manually.")
        return null
      }
      return address
    } catch {
      setError("We couldn't reach the address service. Please fill it in manually.")
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, resolve }
}
