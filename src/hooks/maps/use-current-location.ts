'use client'

import * as React from 'react'
import { useReverseGeocode } from './use-reverse-geocode'
import type { ResolvedAddress } from '@/lib/maps/types'

interface UseCurrentLocationResult {
  locating: boolean
  error: string | null
  requestLocation: () => Promise<ResolvedAddress | null>
}

/** Requests browser geolocation, then reverse-geocodes it. Never blocks — callers keep manual entry available on any failure. */
export function useCurrentLocation(): UseCurrentLocationResult {
  const [locating, setLocating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const { resolve } = useReverseGeocode()

  const requestLocation = React.useCallback((): Promise<ResolvedAddress | null> => {
    return new Promise((resolvePromise) => {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        setError('Location is not supported on this device.')
        resolvePromise(null)
        return
      }

      setLocating(true)
      setError(null)

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          const address = await resolve(latitude, longitude)
          setLocating(false)
          if (!address) {
            // Keep the coordinates even if reverse geocoding failed.
            resolvePromise({
              province: '',
              district: '',
              commune: '',
              village: '',
              streetAddress: '',
              postalCode: '',
              latitude,
              longitude,
              formatted: '',
            })
            return
          }
          resolvePromise(address)
        },
        () => {
          setLocating(false)
          setError('Location permission denied. You can still enter your address manually.')
          resolvePromise(null)
        }
      )
    })
  }, [resolve])

  return { locating, error, requestLocation }
}
