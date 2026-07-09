'use client'

import { useEffect } from 'react'

// Only triggers if the root layout itself throws — error.tsx can't catch
// that since it renders inside the layout. Must render its own <html>/<body>
// since it replaces the entire root, and stays framework-free (no imported
// components, no Tailwind-dependent classes beyond basic inline styles) so
// it can never itself fail to render.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app] root layout crashed', { digest: error.digest, message: error.message })
  }, [error])

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '5rem 1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ marginTop: '0.75rem', color: '#666' }}>
          We hit an unexpected error. Please try again in a moment.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: '2rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            background: '#111',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
