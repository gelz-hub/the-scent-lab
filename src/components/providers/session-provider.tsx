'use client'

// Custom-auth SessionProvider. Deliberately keeps the same names/shapes
// (`useSession()` returning `{ data, status }`, `signOut()`) so existing
// client call sites don't need changes — only the internals swapped from
// Firebase's onIdTokenChanged to a fetch against /api/auth/me, since an
// httpOnly session cookie isn't readable from client JS.

import * as React from 'react'

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface SessionUser {
  id: string
  email: string | null
  name: string | null
  role: string
}

export interface Session {
  user: SessionUser
}

interface SessionContextValue {
  data: Session | null
  status: SessionStatus
  refresh: () => Promise<void>
}

const SessionContext = React.createContext<SessionContextValue>({
  data: null,
  status: 'loading',
  refresh: async () => {},
})

async function fetchSession(): Promise<Session | null> {
  const res = await fetch('/api/auth/me')
  if (!res.ok) return null
  const data = await res.json()
  return data.user ? { user: data.user } : null
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = React.useState<Omit<SessionContextValue, 'refresh'>>({
    data: null,
    status: 'loading',
  })

  const refresh = React.useCallback(async () => {
    const session = await fetchSession()
    setValue({ data: session, status: session ? 'authenticated' : 'unauthenticated' })
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <SessionContext.Provider value={{ ...value, refresh }}>{children}</SessionContext.Provider>
  )
}

export function useSession(): { data: Session | null; status: SessionStatus } {
  const { data, status } = React.useContext(SessionContext)
  return { data, status }
}

export async function signOut(options?: { callbackUrl?: string; redirect?: boolean }) {
  await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {})
  if (options?.callbackUrl) {
    window.location.href = options.callbackUrl
  }
}
