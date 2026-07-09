import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

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
      // .env stores literal "\n" sequences; convert back to real newlines.
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
  return app
}

export function getAdminMessaging() {
  const adminApp = getFirebaseAdminApp()
  if (!adminApp) return null
  return getMessaging(adminApp)
}
