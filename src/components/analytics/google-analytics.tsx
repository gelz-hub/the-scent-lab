'use client'

import * as React from 'react'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'

const GA_ID = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function GAPageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  React.useEffect(() => {
    if (!GA_ID || !window.gtag) return
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    window.gtag('config', GA_ID, { page_path: url })
  }, [pathname, searchParams])

  return null
}

export function GoogleAnalytics() {
  if (!GA_ID) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
      <React.Suspense fallback={null}>
        <GAPageviewTracker />
      </React.Suspense>
    </>
  )
}
