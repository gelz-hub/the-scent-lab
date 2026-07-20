'use client'

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  signOut as firebaseSignOut,
  onIdTokenChanged,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth } from './client'

async function establishSession(user: User) {
  const idToken = await user.getIdToken()
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Could not establish session')
  }
}

export async function signInWithEmail(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
  await establishSession(user)
}

export async function sendPasswordResetEmail(email: string) {
  await firebaseSendPasswordResetEmail(getFirebaseAuth(), email)
}

export async function confirmPasswordReset(oobCode: string, newPassword: string) {
  await firebaseConfirmPasswordReset(getFirebaseAuth(), oobCode, newPassword)
}

export async function signOutEverywhere() {
  await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {})
  await firebaseSignOut(getFirebaseAuth())
}

export { onIdTokenChanged }
export type { User }
