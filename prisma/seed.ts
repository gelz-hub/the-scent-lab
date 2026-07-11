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

  console.log('Seeded 3 users (admin/staff/customer). Catalog data (products, brands, categories, collections) is managed entirely through the admin panel — this script no longer seeds demo products.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
