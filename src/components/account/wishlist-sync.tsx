'use client'

import * as React from 'react'
import { useSession } from '@/components/providers/session-provider'
import { useStore } from '@/lib/store'

/** Hydrates the client wishlist store from the DB on login — mounted once in the root layout, mirrors NotificationListener's pattern. Merges rather than overwrites, so anything wishlisted as a guest before signing in isn't lost. */
export function WishlistSync() {
  const { status } = useSession()
  const hydrateWishlist = useStore((s) => s.hydrateWishlist)
  const synced = React.useRef(false)

  React.useEffect(() => {
    if (status !== 'authenticated' || synced.current) return
    synced.current = true

    fetch('/api/wishlist')
      .then((res) => res.json())
      .then((data: { productIds?: string[] }) => {
        if (!data.productIds) return
        const local = useStore.getState().wishlist
        const merged = Array.from(new Set([...data.productIds, ...local]))
        hydrateWishlist(merged)
      })
      .catch(() => {})
  }, [status, hydrateWishlist])

  return null
}
