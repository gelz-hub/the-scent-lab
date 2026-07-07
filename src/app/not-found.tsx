import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <p className="font-display text-8xl font-medium tracking-tight text-brand sm:text-9xl">404</p>
      <h1 className="mt-4 font-display text-3xl font-medium tracking-tight">Page not found</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        The page you're looking for doesn't exist or has been moved. Let's get you
        back to discovering beautiful fragrances.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
        >
          <Home className="h-4 w-4" strokeWidth={1.5} />
          Back home
        </Link>
        <Link
          href="/shop"
          className="flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-foreground/40"
        >
          <Search className="h-4 w-4" strokeWidth={1.5} />
          Browse shop
        </Link>
      </div>
    </div>
  )
}
