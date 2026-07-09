'use client'

import * as React from 'react'
import { Search, Loader2, MapPin } from 'lucide-react'
import { useAddressSearch } from '@/hooks/maps/use-address-search'
import { MapError } from './MapError'
import type { AddressSuggestion } from '@/lib/maps/types'

interface AddressSearchProps {
  onSelect: (suggestion: AddressSuggestion) => void
  className?: string
}

export function AddressSearch({ onSelect, className }: AddressSearchProps) {
  const { query, setQuery, suggestions, loading, error, clear } = useAddressSearch()
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(s: AddressSuggestion) {
    onSelect(s)
    setOpen(false)
    clear()
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <div className="flex items-center gap-2 rounded-lg border border-border px-3 focus-within:border-foreground/60">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search for an address…"
          aria-label="Search address"
          aria-expanded={open && suggestions.length > 0}
          role="combobox"
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1.5 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-background shadow-lg">
          {suggestions.map((s, i) => (
            <li key={`${s.formatted}-${i}`}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <span className="line-clamp-2">{s.formatted}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <MapError message={error} className="mt-2" />}
    </div>
  )
}
