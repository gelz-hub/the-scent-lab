// StaffService — creating staff accounts and changing roles. Only ever
// touches User.role/name/email for non-CUSTOMER accounts; never touches
// Address/Wishlist/Review (those stay customer-owned per spec, and staff
// accounts don't have them anyway). See src/lib/rbac/README.md.

import { db } from '@/lib/db'
import { getAdminAuth } from '@/lib/firebase/admin-auth'
import { ADMIN_ROLES, type AdminRole } from './permissions'

export async function listStaff() {
  return db.user.findMany({
    where: { role: { in: ADMIN_ROLES } },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
}

export interface CreateStaffInput {
  email: string
  name: string
  password: string
  role: AdminRole
}

// Prisma row is created first so its auto-generated cuid can be reused as
// the Firebase uid (see src/lib/auth/session.ts — the two ids are always
// kept identical). If Firebase user creation fails, the Prisma row is
// rolled back so we never end up with a staff account that can't sign in.
export async function createStaffAccount(input: CreateStaffInput) {
  const user = await db.user.create({
    data: {
      email: input.email.toLowerCase(),
      name: input.name,
      role: input.role,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  try {
    await getAdminAuth().createUser({
      uid: user.id,
      email: user.email,
      password: input.password,
      displayName: user.name ?? undefined,
    })
    await getAdminAuth().setCustomUserClaims(user.id, { role: user.role })
  } catch (err) {
    await db.user.delete({ where: { id: user.id } })
    throw err
  }

  return user
}

export async function changeStaffRole(userId: string, role: AdminRole) {
  const user = await db.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  })
  await getAdminAuth().setCustomUserClaims(userId, { role })
  return user
}

/** Revokes admin access — demotes back to CUSTOMER rather than deleting the account (preserves their order/audit history intact). */
export async function revokeStaffAccess(userId: string) {
  const user = await db.user.update({ where: { id: userId }, data: { role: 'CUSTOMER' }, select: { id: true, role: true } })
  await getAdminAuth().setCustomUserClaims(userId, { role: 'CUSTOMER' })
  return user
}
