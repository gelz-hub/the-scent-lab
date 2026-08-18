// Session cookie holds a random 256-bit token; only its SHA-256 hash is
// stored (src/lib/db.ts Session model) so a DB read alone can't yield a
// usable session. Chosen over a signed-JWT cookie: no secret to manage,
// and logout/revocation is just deleting the row.

import { cookies } from 'next/headers'
import { randomBytes, createHash } from 'crypto'
import { db } from '@/lib/db'

export const SESSION_COOKIE_NAME = 'session'
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days — matches the previous Firebase session cookie lifetime

export interface AuthSession {
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Creates a session row for `userId` and returns the raw token to set as the cookie value. */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
    },
  })
  return token
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      expiresAt: true,
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  })
  if (!session || session.expiresAt < new Date()) return null

  return { user: session.user }
}

/** Deletes the session row matching the current cookie, if any. Does not clear the cookie itself — the caller does that. */
export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return
  await db.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => {})
}
