'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { onForegroundMessage } from '@/lib/firebase/client'
import { isFirebaseConfigured } from '@/lib/firebase/config'

export function NotificationListener() {
  const router = useRouter()

  React.useEffect(() => {
    if (!isFirebaseConfigured) return
    let unsubscribe: (() => void) | undefined

    onForegroundMessage(({ title, body, url }) => {
      toast(title || 'The Scent Lab', {
        description: body,
        action: url ? { label: 'View', onClick: () => router.push(url) } : undefined,
      })
    }).then((unsub) => {
      unsubscribe = unsub
    })

    return () => unsubscribe?.()
  }, [router])

  return null
}
