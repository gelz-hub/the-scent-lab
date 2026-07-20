'use client'

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics'
import { getAuth, type Auth } from 'firebase/auth'
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported as messagingSupported,
  type Messaging,
} from 'firebase/messaging'
import { firebaseConfig, firebaseVapidKey, isFirebaseConfigured } from './config'

function getFirebaseApp() {
  if (!isFirebaseConfigured) return null
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

let authInstance: Auth | null = null

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    const app = getFirebaseApp()
    if (!app) throw new Error('Firebase is not configured')
    authInstance = getAuth(app)
  }
  return authInstance
}

export async function initAnalytics() {
  const app = getFirebaseApp()
  if (!app || typeof window === 'undefined') return null
  if (!(await analyticsSupported())) return null
  return getAnalytics(app)
}

let messagingInstance: Messaging | null = null

async function getMessagingInstance() {
  const app = getFirebaseApp()
  if (!app || typeof window === 'undefined') return null
  if (!(await messagingSupported())) return null
  if (!messagingInstance) messagingInstance = getMessaging(app)
  return messagingInstance
}

/**
 * Registers the FCM service worker, requests notification permission, and
 * returns a device push token — or null if unsupported/unconfigured/denied.
 */
export async function requestPushToken(): Promise<string | null> {
  if (!isFirebaseConfigured) return null
  if (typeof window === 'undefined' || !('Notification' in window)) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const messaging = await getMessagingInstance()
  if (!messaging || !firebaseVapidKey) return null

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
  const token = await getToken(messaging, {
    vapidKey: firebaseVapidKey,
    serviceWorkerRegistration: registration,
  }).catch(() => null)

  return token
}

/** Subscribes to foreground (tab-open) push messages. Returns an unsubscribe fn. */
export async function onForegroundMessage(
  callback: (payload: { title?: string; body?: string; url?: string }) => void
) {
  const messaging = await getMessagingInstance()
  if (!messaging) return () => {}

  return onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
      url: payload.data?.url,
    })
  })
}
