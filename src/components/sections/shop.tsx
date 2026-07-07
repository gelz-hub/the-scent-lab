'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, Search, X, Check, ChevronDown } from 'lucide-react'
import {
  products,
  brands,
  allCategories,
  allCollections,
  priceRange,
  type Gender,
  type CollectionTag,
} from '@/lib/data'
import { ProductCard } from '@/components/site/product-card'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/format'

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'rating', label: 'Top Rated' },
  { key: 'newest', label: 'Newest' },
]

const PR = priceRange()
const MAX_PRICE = Math.ceil(PR.max / 50) * 50

function cheapestPrice(p: (typeof products)[number]) {
  return Math.min(...p.volumes.map((v) => v.price))
}

interface FilterState {
  genders: Set<Gender>
  brandSlugs: Set<string>
  collections: Set<CollectionTag>
  maxPrice: number
}

function FilterPanel({
  state,
  setState,
}: {
  state: FilterState
  setState: (s: FilterState) => void
}) {
  const toggle = <T,>(set: Set<T>, v: T): Set<T> => {
    const next = new Set(set)
    if (next.has(v)) next.delete(v)
    else next.add(v)
    return next
  }

  return (
    <div className="space-y-7">
      {/* Gender */}
      <FilterGroup title="Gender">
        {allCategories.map((g) => (
          <CheckRow
            key={g}
            checked={state.genders.has(g)}
            onChange={() =>
              setState({ ...state, genders: toggle(state.genders, g) })
            }
            label={g}
          />
        ))}
      </FilterGroup>

      {/* Collection */}
      <FilterGroup title="Collection">
        {allCollections.map((c) => (
          <CheckRow
            key={c}
            checked={state.collections.has(c)}
            onChange={() =>
              setState({ ...state, collections: toggle(state.collections, c) })
            }
            label={c}
          />
        ))}
      </FilterGroup>

      {/* Brand */}
      <FilterGroup title="Brand">
        <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
          {brands.map((b) => (
            <CheckRow
              key={b.slug}
              checked={state.brandSlugs.has(b.slug)}
              onChange={() =>
                setState({ ...state, brandSlugs: toggle(state.brandSlugs, b.slug) })
              }
              label={b.name}
              meta={String(b.productCount)}
            />
          ))}
        </div>
      </FilterGroup>

      {/* Price */}
      <FilterGroup title="Max Price">
        <div className="px-1">
          <Slider
            value={[state.maxPrice]}
            min={PR.min}
            max={MAX_PRICE}
            step={10}
            onValueChange={(v) => setState({ ...state, maxPrice: v[0] })}
            className="mt-3"
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{formatPrice(PR.min)}</span>
            <span className="font-medium text-foreground">
              {formatPrice(state.maxPrice)}
            </span>
          </div>
        </div>
      </FilterGroup>
    </div>
  )
}

function FilterGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function CheckRow({
  checked,
  onChange,
  label,
  meta,
}: {
  checked: boolean
  onChange: () => void
  label: string
  meta?: string
}) {
  return (
    <button
      onClick={onChange}
      className="flex w-full items-center gap-2.5 rounded-md py-1.5 text-left text-sm transition-colors hover:text-foreground"
    >
      <span
        className={cn(
          'grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors',
          checked
            ? 'border-foreground bg-foreground text-background'
            : 'border-border'
        )}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className={cn('flex-1', checked ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
      {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
    </button>
  )
}

export function ShopSection() {
  const [query, setQuery] = React.useState('')
  const [sort, setSort] = React.useState<SortKey>('featured')
  const [visible, setVisible] = React.useState(8)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [state, setState] = React.useState<FilterState>({
    genders: new Set(),
    brandSlugs: new Set(),
    collections: new Set(),
    maxPrice: MAX_PRICE,
  })

  const activeCount =
    state.genders.size + state.brandSlugs.size + state.collections.size +
    (state.maxPrice < MAX_PRICE ? 1 : 0)

  const filtered = React.useMemo(() => {
    let list = products.filter((p) => {
      if (state.genders.size && !state.genders.has(p.gender)) return false
      if (state.brandSlugs.size && !state.brandSlugs.has(p.brandSlug)) return false
      if (state.collections.size && !p.collection.some((c) => state.collections.has(c)))
        return false
      if (cheapestPrice(p) > state.maxPrice) return false
      if (query.trim()) {
        const hay = [
          p.name,
          p.brand,
          p.gender,
          ...p.notes.top,
          ...p.notes.heart,
          ...p.notes.base,
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(query.trim().toLowerCase())) return false
      }
      return true
    })

    list = list.sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return cheapestPrice(a) - cheapestPrice(b)
        case 'price-desc':
          return cheapestPrice(b) - cheapestPrice(a)
        case 'rating':
          return b.rating - a.rating
        case 'newest':
          if (a.tags.includes('New') !== b.tags.includes('New'))
            return a.tags.includes('New') ? -1 : 1
          return b.year - a.year
        default:
          if (a.tags.includes('Featured') !== b.tags.includes('Featured'))
            return a.tags.includes('Featured') ? -1 : 1
          return b.rating - a.rating
      }
    })
    return list
  }, [state, sort, query])

  const shown = filtered.slice(0, visible)

  const clearAll = () => {
    setState({
      genders: new Set(),
      brandSlugs: new Set(),
      collections: new Set(),
      maxPrice: MAX_PRICE,
    })
    setQuery('')
    setVisible(8)
  }

  const removeGender = (g: Gender) =>
    setState((s) => {
      const n = new Set(s.genders)
      n.delete(g)
      return { ...s, genders: n }
    })

  return (
    <section id="shop" className="border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Heading */}
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
            The edit
          </p>
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl md:text-[2.75rem]">
            Shop all fragrances
          </h2>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setVisible(8)
              }}
              placeholder="Search within shop…"
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile filter trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
                  Filters
                  {activeCount > 0 && (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-foreground text-[10px] text-background">
                      {activeCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[88%] max-w-sm overflow-y-auto border-border p-0">
                <SheetHeader className="flex-row items-center justify-between border-b border-border px-5 py-4">
                  <SheetTitle className="font-display text-xl">Filters</SheetTitle>
                  {activeCount > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear all
                    </button>
                  )}
                </SheetHeader>
                <div className="p-5">
                  <FilterPanel state={state} setState={setState} />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-10 appearance-none rounded-lg border border-border bg-background pl-4 pr-9 text-sm font-medium outline-none transition-colors hover:border-foreground/40 focus:border-foreground"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    Sort: {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold">Filters</p>
                {activeCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear all ({activeCount})
                  </button>
                )}
              </div>
              <FilterPanel state={state} setState={setState} />
            </div>
          </aside>

          {/* Grid */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? 'fragrance' : 'fragrances'}
              </p>
            </div>

            {/* Active chips */}
            {activeCount > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {[...state.genders].map((g) => (
                  <Chip key={g} label={g} onRemove={() => removeGender(g)} />
                ))}
                {[...state.brandSlugs].map((slug) => {
                  const b = brands.find((x) => x.slug === slug)!
                  return (
                    <Chip
                      key={slug}
                      label={b.name}
                      onRemove={() =>
                        setState((s) => {
                          const n = new Set(s.brandSlugs)
                          n.delete(slug)
                          return { ...s, brandSlugs: n }
                        })
                      }
                    />
                  )
                })}
                {[...state.collections].map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    onRemove={() =>
                      setState((s) => {
                        const n = new Set(s.collections)
                        n.delete(c)
                        return { ...s, collections: n }
                      })
                    }
                  />
                ))}
                {state.maxPrice < MAX_PRICE && (
                  <Chip
                    label={`≤ ${formatPrice(state.maxPrice)}`}
                    onRemove={() => setState((s) => ({ ...s, maxPrice: MAX_PRICE }))}
                  />
                )}
              </div>
            )}

            {shown.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-20 text-center">
                <p className="font-display text-xl">No fragrances match</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your filters or search.
                </p>
                <button
                  onClick={clearAll}
                  className="mt-4 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <motion.div
                key={state.genders.size + '-' + state.brandSlugs.size + '-' + sort}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3"
              >
                {shown.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </motion.div>
            )}

            {visible < filtered.length && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setVisible((v) => v + 8)}
                  className="rounded-lg border border-border px-8 py-3 text-sm font-medium transition-colors hover:border-foreground/40 hover:bg-surface"
                >
                  Load more ({filtered.length - visible} more)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium">
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-3 w-3" strokeWidth={2} />
      </button>
    </span>
  )
}
