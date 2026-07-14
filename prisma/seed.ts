import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin12345', 10)
  await db.user.upsert({
    where: { email: 'admin@thescentlab.com' },
    update: {},
    create: {
      email: 'admin@thescentlab.com',
      name: 'Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  })

  const staffPassword = await bcrypt.hash('staff12345', 10)
  await db.user.upsert({
    where: { email: 'staff@thescentlab.com' },
    update: {},
    create: {
      email: 'staff@thescentlab.com',
      name: 'Staff',
      passwordHash: staffPassword,
      role: 'STAFF',
    },
  })

  const customerPassword = await bcrypt.hash('customer12345', 10)
  await db.user.upsert({
    where: { email: 'customer@thescentlab.com' },
    update: {},
    create: {
      email: 'customer@thescentlab.com',
      name: 'Guest Customer',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
    },
  })

  const now = new Date()
  const farFuture = new Date('2099-01-01T00:00:00.000Z')
  await db.coupon.upsert({
    where: { code: 'SCENT10' },
    update: {},
    create: { code: 'SCENT10', type: 'PERCENTAGE', value: 10, startsAt: now, expiresAt: farFuture },
  })
  await db.coupon.upsert({
    where: { code: 'WELCOME15' },
    update: {},
    create: { code: 'WELCOME15', type: 'PERCENTAGE', value: 15, startsAt: now, expiresAt: farFuture },
  })
  await db.coupon.upsert({
    where: { code: 'FREESHIP' },
    update: {},
    create: {
      code: 'FREESHIP',
      type: 'FREE_SHIPPING',
      value: null,
      startsAt: now,
      expiresAt: new Date('2027-12-31T23:59:59.000Z'),
    },
  })

  console.log('Seeded 3 users (admin/staff/customer) and 3 coupons (SCENT10, WELCOME15, FREESHIP). Catalog data (products, brands, categories, collections) is managed entirely through the admin panel — this script no longer seeds demo products.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
