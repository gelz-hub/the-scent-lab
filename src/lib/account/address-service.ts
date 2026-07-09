// AddressService — the customer's reusable saved-address book. Separate
// from OrderAddress (the immutable per-order snapshot Checkout creates) and
// from every other Part 7 service — never imports WishlistService,
// ReviewService, or CustomerService. See src/lib/account/README.md.

import { db } from '@/lib/db'
import type { DeliveryCompany, DeliveryType, PreferredDeliveryTime } from '@prisma/client'

export interface AddressInput {
  label: string
  recipientName: string
  phone: string
  email?: string
  province: string
  district: string
  commune?: string
  village?: string
  houseNumber?: string
  streetAddress: string
  postalCode?: string
  deliveryType?: DeliveryType
  deliveryCompany?: DeliveryCompany | null
  deliveryNote?: string
  preferredDeliveryTime?: PreferredDeliveryTime
  latitude?: number
  longitude?: number
}

export async function listAddresses(userId: string) {
  return db.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] })
}

export async function getAddress(userId: string, addressId: string) {
  return db.address.findFirst({ where: { id: addressId, userId } })
}

/** The first saved address is automatically the default — a customer's address book is never empty-but-defaultless once they've saved one. */
export async function createAddress(userId: string, input: AddressInput, makeDefault = false) {
  const existingCount = await db.address.count({ where: { userId } })
  const shouldBeDefault = makeDefault || existingCount === 0

  return db.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } })
    }
    return tx.address.create({
      data: { userId, ...input, isDefault: shouldBeDefault },
    })
  })
}

export async function updateAddress(userId: string, addressId: string, input: Partial<AddressInput>) {
  const existing = await db.address.findFirst({ where: { id: addressId, userId } })
  if (!existing) return null
  return db.address.update({ where: { id: addressId }, data: input })
}

/** Exactly one default per user — unsets every other address's default flag in the same transaction before setting this one, since MySQL has no native "at most one true per group" constraint. */
export async function setDefaultAddress(userId: string, addressId: string) {
  const existing = await db.address.findFirst({ where: { id: addressId, userId } })
  if (!existing) return null

  return db.$transaction(async (tx) => {
    await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } })
    return tx.address.update({ where: { id: addressId }, data: { isDefault: true } })
  })
}

/** If the deleted address was the default, promotes the next-most-recent remaining address (if any) to default — a customer with saved addresses is never left with none marked default. */
export async function deleteAddress(userId: string, addressId: string) {
  const existing = await db.address.findFirst({ where: { id: addressId, userId } })
  if (!existing) return false

  await db.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: addressId } })
    if (existing.isDefault) {
      const next = await tx.address.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } })
    }
  })
  return true
}
