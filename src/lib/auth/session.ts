// Drop-in replacement for NextAuth's `getServerSession(authOptions)` — same
// `{ user: { id, email, name, role } } | null` shape, so call sites only
// need an import/name swap. Verifies the Firebase session cookie
// authoritatively (checks revocation), unlike middleware's fast JWKS check.

import { cookies } from 'next/headers'
import { verifySessionCookie } from '@/lib/firebase/admin-auth'
import { db } from '@/lib/db'

export const SESSION_COOKIE_NAME = 'session'

export interface AuthSession {
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!sessionCookie) return null

  try {
    const decoded = await verifySessionCookie(sessionCookie)
    const user = await db.user.findUnique({
      where: { id: decoded.uid },
      select: { id: true, email: true, name: true, role: true },
    })
    if (!user) return null
    return { user }
  } catch {
    return null
  }
}
