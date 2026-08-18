// See src/lib/firebase/admin-auth.ts for why every firebase-admin entry
// point is dynamically imported instead of statically imported here.
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

  console.log('[FIREBASE_ADMIN]', {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmailPresent: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKeyPresent: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    privateKeyLength: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length,
  })

  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // .env stores literal "\n" sequences; convert back to real newlines.
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
  return app
}

export async function getAdminMessaging() {
  const adminApp = await getFirebaseAdminApp()
  if (!adminApp) return null
  const { getMessaging } = await import('firebase-admin/messaging')
  return getMessaging(adminApp)
}
