import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { products } from '../src/lib/data'

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

  for (const p of products) {
    await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        brandSlug: p.brandSlug,
        gender: p.gender,
        category: p.category,
        collection: p.collection,
        image: p.image,
        gallery: p.gallery,
        volumes: p.volumes,
        compareAtPrice: p.compareAtPrice ?? null,
        rating: p.rating,
        reviewCount: p.reviewCount,
        description: p.description,
        story: p.story,
        notes: p.notes,
        longevity: p.longevity,
        projection: p.projection,
        sillage: p.sillage,
        seasons: p.seasons,
        occasions: p.occasions,
        country: p.country,
        year: p.year,
        tags: p.tags,
        stock: p.stock,
      },
    })
  }

  console.log(`Seeded ${products.length} products and 3 users (admin/staff/customer).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
