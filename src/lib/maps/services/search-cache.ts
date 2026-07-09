import type { AddressSuggestion } from '@/lib/maps/types'
import { addressSearchConfig } from '@/lib/maps/config'

interface CacheEntry {
  results: AddressSuggestion[]
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()

export function getCached(query: string): AddressSuggestion[] | null {
  const entry = cache.get(query.trim().toLowerCase())
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(query.trim().toLowerCase())
    return null
  }
  return entry.results
}

export function setCached(query: string, results: AddressSuggestion[]) {
  cache.set(query.trim().toLowerCase(), { results, expiresAt: Date.now() + addressSearchConfig.cacheTtlMs })
}
