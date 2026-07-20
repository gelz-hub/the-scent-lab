// CustomerService — profile (name/phone/dateOfBirth/avatar/preferences) and
// account security (password change). Never touches Address/Wishlist/
// Review/AccountNotification directly — see src/lib/account/README.md.

import { db } from '@/lib/db'
import { getAdminAuth } from '@/lib/firebase/admin-auth'

export interface ProfileUpdateInput {
  name?: string
  phone?: string
  dateOfBirth?: Date | null
  avatarPublicId?: string
  avatarUrl?: string
  preferredLanguage?: string
  preferredCurrency?: string
}

export async function getProfile(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      dateOfBirth: true,
      avatarUrl: true,
      preferredLanguage: true,
      preferredCurrency: true,
      role: true,
      createdAt: true,
    },
  })
}

export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  return db.user.update({
    where: { id: userId },
    data: input,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      dateOfBirth: true,
      avatarUrl: true,
      preferredLanguage: true,
      preferredCurrency: true,
    },
  })
}

export class InvalidCurrentPasswordError extends Error {
  constructor() {
    super('Current password is incorrect.')
    this.name = 'InvalidCurrentPasswordError'
  }
}

// Admin SDK can set a password but can't verify one, so the current
// password is checked via the Identity Toolkit REST API (the same check
// the client SDK's signInWithEmailAndPassword performs) before rotating it.
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } })

  const verifyRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: currentPassword, returnSecureToken: false }),
    }
  )
  if (!verifyRes.ok) throw new InvalidCurrentPasswordError()

  await getAdminAuth().updateUser(userId, { password: newPassword })
}
