import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

export const isFirebaseAdminConfigured = Boolean(
  process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
)

let app: App | null = null

function getFirebaseAdminApp(): App | null {
  if (!isFirebaseAdminConfigured) return null
  if (app) return app
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

export function getAdminAuth() {
  const adminApp = getFirebaseAdminApp()
  if (!adminApp) throw new Error('Firebase Admin is not configured')
  return getAuth(adminApp)
}

// 7 days — matches the previous NextAuth session/JWT maxAge so session
// lifetime behavior doesn't change for users during the migration.
export const SESSION_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export async function createSessionCookie(idToken: string) {
  return getAdminAuth().createSessionCookie(idToken, { expiresIn: SESSION_COOKIE_MAX_AGE_MS })
}

export async function verifySessionCookie(sessionCookie: string) {
  return getAdminAuth().verifySessionCookie(sessionCookie, true)
}
