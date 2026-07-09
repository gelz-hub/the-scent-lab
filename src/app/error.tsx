'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Home, RotateCw } from 'lucide-react'

// Catches unhandled errors thrown by any page/component under this segment.
// Never shows the error's own message or stack to the user — only a generic
// message, with the actual error logged server-side (Next.js already reports
// it to the server console/error-reporting pipeline via this callback).
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app] unhandled page error', { digest: error.digest, message: error.message })
  }, [error])

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <p className="font-display text-8xl font-medium tracking-tight text-brand sm:text-9xl">500</p>
      <h1 className="mt-4 font-display text-3xl font-medium tracking-tight">Something went wrong</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        We hit an unexpected error on our end. Please try again, or head back home if the
        problem continues.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
        >
          <RotateCw className="h-4 w-4" strokeWidth={1.5} />
          Try again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-foreground/40"
        >
          <Home className="h-4 w-4" strokeWidth={1.5} />
          Back home
        </Link>
      </div>
    </div>
  )
}
