// StaffService — creating staff accounts and changing roles. Only ever
// touches User.role/name/email for non-CUSTOMER accounts; never touches
// Address/Wishlist/Review (those stay customer-owned per spec, and staff
// accounts don't have them anyway). See src/lib/rbac/README.md.

import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
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

export async function createStaffAccount(input: CreateStaffInput) {
  const passwordHash = await bcrypt.hash(input.password, 10)
  return db.user.create({
    data: {
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash,
      role: input.role,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
}

export async function changeStaffRole(userId: string, role: AdminRole) {
  return db.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  })
}

/** Revokes admin access — demotes back to CUSTOMER rather than deleting the account (preserves their order/audit history intact). */
export async function revokeStaffAccess(userId: string) {
  return db.user.update({ where: { id: userId }, data: { role: 'CUSTOMER' }, select: { id: true, role: true } })
}
