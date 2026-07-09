'use client'

import * as React from 'react'
import { searchAddress } from '@/lib/maps/services/geoapify'
import { getCached, setCached } from '@/lib/maps/services/search-cache'
import { addressSearchConfig } from '@/lib/maps/config'
import type { AddressSuggestion } from '@/lib/maps/types'

interface UseAddressSearchResult {
  query: string
  setQuery: (q: string) => void
  suggestions: AddressSuggestion[]
  loading: boolean
  error: string | null
  clear: () => void
}

/** Debounced, cached address autocomplete against our own API — tuning lives in @/lib/maps/config. */
export function useAddressSearch(): UseAddressSearchResult {
  const [query, setQuery] = React.useState('')
  const [suggestions, setSuggestions] = React.useState<AddressSuggestion[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = React.useRef(0)

  React.useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    const trimmed = query.trim()
    if (trimmed.length < addressSearchConfig.minChars) {
      setSuggestions([])
      setLoading(false)
      setError(null)
      return
    }

    const cached = getCached(trimmed)
    if (cached) {
      setSuggestions(cached)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    const currentRequestId = ++requestIdRef.current

    timeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchAddress(trimmed)
        if (requestIdRef.current !== currentRequestId) return // a newer query superseded this one
        setCached(trimmed, results)
        setSuggestions(results)
        if (results.length === 0) {
          setError(null) // empty results aren't an error — just no matches
        }
      } catch {
        if (requestIdRef.current !== currentRequestId) return
        setError("We couldn't search right now. You can still enter your address manually.")
        setSuggestions([])
      } finally {
        if (requestIdRef.current === currentRequestId) setLoading(false)
      }
    }, addressSearchConfig.debounceMs)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [query])

  const clear = React.useCallback(() => {
    setQuery('')
    setSuggestions([])
    setError(null)
  }, [])

  return { query, setQuery, suggestions, loading, error, clear }
}
