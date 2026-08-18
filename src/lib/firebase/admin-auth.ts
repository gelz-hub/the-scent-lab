// firebase-admin's package.json "exports" map splits ./app and ./auth into
// separate require/import conditions; a static `import ... from
// 'firebase-admin/auth'` gets resolved via require() by some bundlers/
// tracers (Next's standalone output, in particular), which throws
// ERR_REQUIRE_ESM. Dynamic import() always goes through Node's ESM
// resolver instead, so every firebase-admin entry point is loaded lazily
// here rather than statically imported.
import type { App } from 'firebase-admin/app'

export const isFirebaseAdminConfigured = Boolean(
  process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
)

let app: App | null = null

async function getFirebaseAdminApp(): Promise<App | null> {
  if (!isFirebaseAdminConfigured) return null
  if (app) return app

  const { initializeApp, getApps, cert } = await import('firebase-admin/app')
  if (getApps().length) {
    app = getApps()[0]
    return app
  }

  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
  return app
}

export async function getAdminAuth() {
  const adminApp = await getFirebaseAdminApp()
  if (!adminApp) throw new Error('Firebase Admin is not configured')
  const { getAuth } = await import('firebase-admin/auth')
  return getAuth(adminApp)
}

// 7 days — matches the previous NextAuth session/JWT maxAge so session
// lifetime behavior doesn't change for users during the migration.
export const SESSION_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export async function createSessionCookie(idToken: string) {
  const auth = await getAdminAuth()
  return auth.createSessionCookie(idToken, { expiresIn: SESSION_COOKIE_MAX_AGE_MS })
}

export async function verifySessionCookie(sessionCookie: string) {
  const auth = await getAdminAuth()
  return auth.verifySessionCookie(sessionCookie, true)
}
