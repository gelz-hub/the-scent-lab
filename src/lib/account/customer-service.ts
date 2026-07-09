// CustomerService — profile (name/phone/dateOfBirth/avatar/preferences) and
// account security (password change). Never touches Address/Wishlist/
// Review/AccountNotification directly — see src/lib/account/README.md.

import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

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

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } })
  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) throw new InvalidCurrentPasswordError()

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await db.user.update({ where: { id: userId }, data: { passwordHash } })
}
