'use client'

// Firebase-backed replacement for next-auth/react's SessionProvider +
// useSession + signOut. Deliberately keeps the same names/shapes
// (`useSession()` returning `{ data, status }`, `signOut()`) so the ~10
// existing client call sites only need their import source changed.

import * as React from 'react'
import { onIdTokenChanged, type User } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { signOutEverywhere } from '@/lib/firebase/auth-client'

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
}

const SessionContext = React.createContext<SessionContextValue>({
  data: null,
  status: 'loading',
})

async function fetchProfile(user: User): Promise<Session | null> {
  const tokenResult = await user.getIdTokenResult()
  const role = (tokenResult.claims.role as string | undefined) ?? 'CUSTOMER'
  return {
    user: {
      id: user.uid,
      email: user.email,
      name: user.displayName,
      role,
    },
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = React.useState<SessionContextValue>({
    data: null,
    status: isFirebaseConfigured ? 'loading' : 'unauthenticated',
  })

  React.useEffect(() => {
    if (!isFirebaseConfigured) return
    const unsubscribe = onIdTokenChanged(getFirebaseAuth(), async (user) => {
      if (!user) {
        setValue({ data: null, status: 'unauthenticated' })
        return
      }
      const session = await fetchProfile(user)
      setValue({ data: session, status: session ? 'authenticated' : 'unauthenticated' })
    })
    return unsubscribe
  }, [])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  return React.useContext(SessionContext)
}

export async function signOut(options?: { callbackUrl?: string; redirect?: boolean }) {
  await signOutEverywhere()
  if (options?.callbackUrl) {
    window.location.href = options.callbackUrl
  }
}
