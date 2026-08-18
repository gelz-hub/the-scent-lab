import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getAdminAuth } from '@/lib/firebase/admin-auth'
import { passwordSchema } from '@/lib/security/password'
import { rateLimit, clientIp } from '@/lib/security/rate-limit'

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
})

// Vercel's Runtime Logs UI/collector truncates long single log lines/values
// (observed: a "Failed to load external module ...: ${err}" message getting
// cut mid-string). console.error-ing one big object is not enough to
// guarantee visibility, so every field is logged on its own line, and long
// string fields are additionally split into fixed-size, indexed chunks —
// no single truncation point can then hide the underlying error.
function logFullError(label: string, error: unknown) {
  console.error(`${label}_TYPE`, typeof error, error instanceof Error ? 'is Error instance' : 'NOT an Error instance')

  if (!(error instanceof Error)) {
    console.error(`${label}_RAW`, error)
    return
  }

  console.error(`${label}_NAME`, error.name)
  console.error(`${label}_CODE`, (error as { code?: unknown }).code)
  console.error(`${label}_CAUSE`, error.cause)
  console.error(`${label}_OWN_PROPERTY_NAMES`, Object.getOwnPropertyNames(error))

  const CHUNK_SIZE = 400
  const logChunked = (fieldLabel: string, value: string | undefined) => {
    if (!value) {
      console.error(fieldLabel, '(empty)')
      return
    }
    console.error(`${fieldLabel}_LENGTH`, value.length)
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      console.error(`${fieldLabel}[${i}-${i + CHUNK_SIZE}]`, value.slice(i, i + CHUNK_SIZE))
    }
  }

  logChunked(`${label}_MESSAGE`, error.message)
  logChunked(`${label}_STACK`, error.stack)

  try {
    logChunked(`${label}_JSON`, JSON.stringify(error, Object.getOwnPropertyNames(error)))
  } catch (stringifyError) {
    console.error(`${label}_JSON_FAILED`, stringifyError instanceof Error ? stringifyError.message : stringifyError)
  }
}

export async function POST(req: Request) {
  console.log('[REGISTER] request received')
  // 5 accounts / hour / IP — registration abuse (bulk fake accounts) is the
  // threat here, not brute force, so the window is longer and the limit
  // lower than login's.
  const { allowed } = await rateLimit(`register:${clientIp(req)}`, 5, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Please check your details and try again.' }, { status: 400 })
  }
  console.log('[REGISTER] validation passed')

  const { name, email, password } = parsed.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
  }

  // Prisma row is created first so its auto-generated cuid can be reused as
  // the Firebase uid — see src/lib/auth/session.ts. Roll back on Firebase
  // failure so we never end up with an account that can't sign in.
  console.log('[REGISTER] creating database user')
  const user = await db.user.create({
    data: { name, email, role: 'CUSTOMER' },
    select: { id: true, email: true, name: true },
  })
  console.log('[REGISTER] database user created')

  try {
    console.log('[REGISTER] creating firebase user')

    let auth
    try {
      auth = await getAdminAuth()
    } catch (error) {
      logFullError('[GET_ADMIN_AUTH_ERROR]', error)
      throw error
    }

    let firebaseUser
    try {
      firebaseUser = await auth.createUser({ uid: user.id, email: user.email, password, displayName: name })
    } catch (error) {
      logFullError('[FIREBASE_CREATE_USER_ERROR]', error)
      throw error
    }
    console.log('[REGISTER] firebase user created', firebaseUser.uid)

    console.log('[REGISTER] setting custom claims')
    await auth.setCustomUserClaims(user.id, { role: 'CUSTOMER' })
    console.log('[REGISTER] custom claims set')
  } catch (err) {
    logFullError('[REGISTER_ERROR]', err)
    await db.user.delete({ where: { id: user.id } })
    const message = err instanceof Error && 'code' in err && (err as { code?: string }).code === 'auth/email-already-exists'
      ? 'An account with this email already exists.'
      : 'Could not create account.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  console.log('[REGISTER] success')
  return NextResponse.json({ user }, { status: 201 })
}
