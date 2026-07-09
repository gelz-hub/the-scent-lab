'use client'

// Thin client-side wrapper around OUR OWN /api/geocode/* routes.
// The Geoapify API key never reaches the browser — see src/lib/checkout/geoapify.ts
// for the server-side calls this proxies.

import type { ResolvedAddress, AddressSuggestion } from '@/lib/maps/types'

export async function reverseGeocode(lat: number, lon: number): Promise<ResolvedAddress | null> {
  const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.address ?? null
}

export async function searchAddress(query: string): Promise<AddressSuggestion[]> {
  const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.suggestions ?? []
}
