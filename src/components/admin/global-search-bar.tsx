'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResults {
  orders?: { id: string; orderNumber: string; status: string }[]
  customers?: { id: string; name: string | null; email: string }[]
  products?: { id: string; name: string; brand: string; slug: string }[]
  invoices?: { id: string; invoiceNumber: string; orderId: string }[]
  payments?: { id: string; providerReference: string | null; orderId: string }[]
  shipments?: { id: string; trackingNumber: string | null; orderId: string }[]
}

const SECTION_LINKS: Record<keyof SearchResults, (item: never) => string> = {
  orders: (item: { id: string }) => `/admin/orders?highlight=${item.id}`,
  customers: (item: { id: string }) => `/admin/customers/${item.id}`,
  products: (item: { id: string }) => `/admin/products?highlight=${item.id}`,
  invoices: (item: { orderId: string }) => `/admin/orders?highlight=${item.orderId}`,
  payments: (item: { orderId: string }) => `/admin/payments?highlight=${item.orderId}`,
  shipments: (item: { orderId: string }) => `/admin/shipments?highlight=${item.orderId}`,
}

const SECTION_LABELS: Record<keyof SearchResults, string> = {
  orders: 'Orders',
  customers: 'Customers',
  products: 'Products',
  invoices: 'Invoices',
  payments: 'Payments',
  shipments: 'Shipments',
}

export function GlobalSearchBar() {
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResults>({})
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults({})
      return
    }
    setLoading(true)
    const timer = setTimeout(() => {
      fetch(`/api/admin/search?q=${encodeURIComponent(query.trim())}`)
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? {}))
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const sections = (Object.keys(results) as (keyof SearchResults)[]).filter((k) => (results[k]?.length ?? 0) > 0)

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search orders, customers, SKU, tracking..."
        className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-foreground/40"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-96 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" strokeWidth={1.5} />
            </div>
          ) : sections.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No matches.</p>
          ) : (
            sections.map((section) => (
              <div key={section} className={cn('px-3 py-2', section !== sections[0] && 'border-t border-border')}>
                <p className="px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{SECTION_LABELS[section]}</p>
                {(results[section] as { id: string }[]).map((item) => (
                  <Link
                    key={item.id}
                    href={SECTION_LINKS[section](item as never)}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-2 py-1.5 text-sm hover:bg-surface"
                  >
                    {renderLabel(section, item)}
                  </Link>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function renderLabel(section: keyof SearchResults, item: Record<string, unknown>): string {
  switch (section) {
    case 'orders':
      return `${item.orderNumber} · ${String(item.status).replace(/_/g, ' ')}`
    case 'customers':
      return `${item.name || 'Unnamed'} · ${item.email}`
    case 'products':
      return `${item.brand} — ${item.name}`
    case 'invoices':
      return String(item.invoiceNumber)
    case 'payments':
      return `Ref: ${item.providerReference || '—'}`
    case 'shipments':
      return `Tracking: ${item.trackingNumber || '—'}`
    default:
      return ''
  }
}
