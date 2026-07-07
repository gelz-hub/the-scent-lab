import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
  searchParams?: Record<string, string | undefined>
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null

  const buildHref = (page: number) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    params.set('page', String(page))
    return `${basePath}?${params.toString()}`
  }

  const pages: (number | '…')[] = []
  const add = (n: number | '…') => pages.push(n)
  if (currentPage > 3) { add(1); add('…') }
  for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) add(i)
  if (currentPage < totalPages - 2) { add('…'); add(totalPages) }
  if (pages[0] !== 1) pages.unshift(1)
  // dedupe
  const seen = new Set<number>()
  const cleaned = pages.filter((p) => { if (p === '…') return true; if (seen.has(p)) return false; seen.add(p); return true })

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          aria-label="Previous page"
          className="grid h-10 w-10 place-items-center rounded-lg border border-border transition-colors hover:border-foreground/40 hover:bg-surface"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        </Link>
      )}
      {cleaned.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
            className={cn(
              'grid h-10 min-w-10 place-items-center rounded-lg border px-3 text-sm font-medium transition-colors',
              p === currentPage
                ? 'border-foreground bg-foreground text-background'
                : 'border-border hover:border-foreground/40 hover:bg-surface'
            )}
          >
            {p}
          </Link>
        )
      )}
      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1)}
          aria-label="Next page"
          className="grid h-10 w-10 place-items-center rounded-lg border border-border transition-colors hover:border-foreground/40 hover:bg-surface"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
        </Link>
      )}
    </nav>
  )
}
