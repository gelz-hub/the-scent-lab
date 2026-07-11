// ProductService — the Part 6 catalog/variant/image CRUD layer. Separate
// from InventoryService (which only ever touches Inventory/InventoryMovement)
// and from the pre-existing storefront Product fields, which this service
// never removes or repurposes — see src/lib/inventory/README.md.

import { db } from '@/lib/db'
import type { Prisma, ProductStatus, ProductVisibility } from '@prisma/client'

export interface ProductSearchFilters {
  q?: string
  brandId?: string
  categoryId?: string
  collectionId?: string
  status?: ProductStatus
  minPrice?: number
  maxPrice?: number
  /** true = only variants with available stock > 0; false = only out-of-stock. */
  availableOnly?: boolean
}

/** Soft-deleted products are excluded from every ProductService read by default — never physically removed once real orders may reference them via OrderItem's snapshot. */
function notDeleted(): Prisma.ProductWhereInput {
  return { deletedAt: null }
}

export async function searchProducts(filters: ProductSearchFilters, options: { take?: number; skip?: number } = {}) {
  const where: Prisma.ProductWhereInput = {
    ...notDeleted(),
    ...(filters.status && { status: filters.status }),
    ...(filters.brandId && { brandId: filters.brandId }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.collectionId && { collectionId: filters.collectionId }),
    // Price lives on ProductVariant, never Product — "products in this price
    // range" means "products with at least one variant in this range".
    ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? {
          variants: {
            some: {
              price: {
                ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
                ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
              },
            },
          },
        }
      : {}),
    ...(filters.q && {
      OR: [
        { name: { contains: filters.q } },
        { brand: { contains: filters.q } },
        { category: { contains: filters.q } },
        { brandRef: { name: { contains: filters.q } } },
        { categoryRef: { name: { contains: filters.q } } },
        { collectionRef: { name: { contains: filters.q } } },
        { variants: { some: { sku: { contains: filters.q } } } },
        { variants: { some: { barcode: { contains: filters.q } } } },
      ],
    }),
  }

  const products = await db.product.findMany({
    where,
    include: {
      brandRef: true,
      categoryRef: true,
      collectionRef: true,
      images: { orderBy: { order: 'asc' } },
      variants: { include: { inventory: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: options.take ?? 50,
    skip: options.skip ?? 0,
  })

  if (filters.availableOnly === undefined) return products

  return products.filter((p) => {
    const totalAvailable = p.variants.reduce((sum, v) => sum + (v.inventory ? v.inventory.currentStock - v.inventory.reservedStock : 0), 0)
    return filters.availableOnly ? totalAvailable > 0 : totalAvailable <= 0
  })
}

export async function getProductById(id: string) {
  return db.product.findFirst({
    where: { id, ...notDeleted() },
    include: {
      brandRef: true,
      categoryRef: true,
      collectionRef: true,
      images: { orderBy: { order: 'asc' } },
      variants: { include: { inventory: true }, orderBy: { volumeMl: 'asc' } },
    },
  })
}

/** Soft delete — sets deletedAt and archives the product; never a physical DELETE (Part 6 spec, and real orders may reference this product's id in their OrderItem snapshot). */
export async function softDeleteProduct(id: string) {
  return db.product.update({ where: { id }, data: { deletedAt: new Date(), status: 'ARCHIVED' } })
}

export async function restoreProduct(id: string) {
  return db.product.update({ where: { id }, data: { deletedAt: null } })
}

export interface CreateProductInput {
  slug: string
  name: string
  description: string
  brandId?: string
  categoryId?: string
  collectionId?: string
  shortDescription?: string
  currency?: string
  featuredImagePublicId?: string
  featuredImageUrl?: string
  seoTitle?: string
  seoDescription?: string
  // Legacy storefront fields this table already required before Part 6 —
  // still populated so the existing storefront keeps rendering unchanged
  // (see the Product model comment in schema.prisma). Not part of the new
  // catalog's own concerns, but required by the column definitions.
  legacy: {
    brand: string
    brandSlug: string
    gender: string
    category: string
    collection: string[]
    image: string
    gallery: string[]
    story: string
    notes: { top: string[]; heart: string[]; base: string[] }
    seasons: string[]
    occasions: string[]
    country: string
    year: number
    tags: string[]
    volumes: { ml: number; price: number }[]
  }
  /**
   * Every product must have at least one variant (business rule — see
   * src/lib/inventory/README.md, "Product Variants"). If omitted or empty, a
   * single variant named "Default" is created automatically using
   * `singleVariantPrice`/`singleVariantStock` — this is the "product without
   * variants" case (e.g. a fragrance sold in only one size), which is really
   * just a product with exactly one variant and no size selector shown.
   */
  variants?: Omit<CreateVariantInput, 'productId'>[]
  singleVariantPrice?: number
  singleVariantStock?: number
}

/**
 * Creates a Product together with its variant(s) in one transaction —
 * guarantees the "every product has at least one variant" invariant can
 * never be violated by a partially-completed create. Price/cost/stock are
 * never accepted as Product-level arguments here; they only exist inside
 * `variants`/`singleVariantPrice`/`singleVariantStock`, which land on
 * ProductVariant/Inventory.
 */
export async function createProductWithVariants(input: CreateProductInput) {
  const variantInputs: Omit<CreateVariantInput, 'productId'>[] =
    input.variants && input.variants.length > 0
      ? input.variants
      : [
          {
            sku: `${input.slug.toUpperCase()}-DEFAULT`,
            name: 'Default',
            price: input.singleVariantPrice ?? 0,
            initialStock: input.singleVariantStock ?? 0,
          },
        ]

  return db.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        shortDescription: input.shortDescription,
        brandId: input.brandId,
        categoryId: input.categoryId,
        collectionId: input.collectionId,
        currency: input.currency ?? 'USD',
        featuredImagePublicId: input.featuredImagePublicId,
        featuredImageUrl: input.featuredImageUrl,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        // Legacy storefront columns — see CreateProductInput.legacy comment.
        brand: input.legacy.brand,
        brandSlug: input.legacy.brandSlug,
        gender: input.legacy.gender,
        category: input.legacy.category,
        collection: input.legacy.collection,
        image: input.legacy.image,
        gallery: input.legacy.gallery,
        story: input.legacy.story,
        notes: input.legacy.notes,
        seasons: input.legacy.seasons,
        occasions: input.legacy.occasions,
        country: input.legacy.country,
        year: input.legacy.year,
        tags: input.legacy.tags,
        volumes: input.legacy.volumes,
      },
    })

    const variants: { variant: Prisma.ProductVariantGetPayload<object>; inventory: Prisma.InventoryGetPayload<object> }[] = []
    for (const v of variantInputs) {
      const variant = await tx.productVariant.create({
        data: {
          productId: product.id,
          sku: v.sku,
          barcode: v.barcode,
          name: v.name,
          volumeMl: v.volumeMl,
          price: v.price,
          costPrice: v.costPrice,
          weight: v.weight,
          status: v.status ?? 'ACTIVE',
          imagePublicId: v.imagePublicId,
          imageUrl: v.imageUrl,
        },
      })
      const inventory = await tx.inventory.create({
        data: {
          variantId: variant.id,
          currentStock: v.initialStock ?? 0,
          safetyStock: v.safetyStock ?? 0,
          reorderLevel: v.reorderLevel ?? 0,
        },
      })
      if (v.initialStock && v.initialStock > 0) {
        await tx.inventoryMovement.create({
          data: {
            variantId: variant.id,
            type: 'PURCHASE',
            quantity: v.initialStock,
            previousStock: 0,
            newStock: v.initialStock,
            reason: 'Initial stock at product creation',
          },
        })
      }
      variants.push({ variant, inventory })
    }

    return { product, variants }
  })
}

// --- Variants -----------------------------------------------------------

export interface CreateVariantInput {
  productId: string
  sku: string
  barcode?: string
  name?: string
  volumeMl?: number
  price: number
  costPrice?: number
  weight?: number
  status?: ProductStatus
  imagePublicId?: string
  imageUrl?: string
  initialStock?: number
  safetyStock?: number
  reorderLevel?: number
}

export async function createVariant(input: CreateVariantInput) {
  return db.$transaction(async (tx) => {
    const variant = await tx.productVariant.create({
      data: {
        productId: input.productId,
        sku: input.sku,
        barcode: input.barcode,
        name: input.name,
        volumeMl: input.volumeMl,
        price: input.price,
        costPrice: input.costPrice,
        weight: input.weight,
        status: input.status ?? 'ACTIVE',
        imagePublicId: input.imagePublicId,
        imageUrl: input.imageUrl,
      },
    })

    const inventory = await tx.inventory.create({
      data: {
        variantId: variant.id,
        currentStock: input.initialStock ?? 0,
        safetyStock: input.safetyStock ?? 0,
        reorderLevel: input.reorderLevel ?? 0,
      },
    })

    if (input.initialStock && input.initialStock > 0) {
      await tx.inventoryMovement.create({
        data: {
          variantId: variant.id,
          type: 'PURCHASE',
          quantity: input.initialStock,
          previousStock: 0,
          newStock: input.initialStock,
          reason: 'Initial stock at variant creation',
        },
      })
    }

    return { variant, inventory }
  })
}

export async function updateVariant(
  variantId: string,
  data: Partial<Pick<CreateVariantInput, 'sku' | 'barcode' | 'name' | 'volumeMl' | 'price' | 'costPrice' | 'weight' | 'status' | 'imagePublicId' | 'imageUrl'>>
) {
  return db.productVariant.update({ where: { id: variantId }, data })
}

/** Variants are never physically deleted either — archived via status so historical InventoryMovement rows referencing them stay meaningful. */
/** Every product must always have at least one non-archived variant (business rule) — refuses to archive a product's last remaining active variant. */
export async function archiveVariant(variantId: string) {
  const variant = await db.productVariant.findUniqueOrThrow({ where: { id: variantId } })
  const activeSiblingCount = await db.productVariant.count({
    where: { productId: variant.productId, status: { not: 'ARCHIVED' }, id: { not: variantId } },
  })
  if (activeSiblingCount === 0) {
    throw new Error('Cannot archive a product\'s only remaining variant — every product must have at least one.')
  }
  return db.productVariant.update({ where: { id: variantId }, data: { status: 'ARCHIVED' } })
}

// --- Images ---------------------------------------------------------------

export interface AddProductImageInput {
  productId: string
  publicId: string
  url: string
  altText?: string
  order?: number
}

export async function addProductImage(input: AddProductImageInput) {
  return db.productImage.create({
    data: {
      productId: input.productId,
      publicId: input.publicId,
      url: input.url,
      altText: input.altText,
      order: input.order ?? 0,
    },
  })
}

export async function removeProductImage(imageId: string) {
  return db.productImage.delete({ where: { id: imageId } })
}

export async function reorderProductImages(productId: string, orderedImageIds: string[]) {
  await db.$transaction(
    orderedImageIds.map((id, index) =>
      db.productImage.update({ where: { id }, data: { order: index } })
    )
  )
  return db.productImage.findMany({ where: { productId }, orderBy: { order: 'asc' } })
}

// --- Brands / Categories / Collections (thin CRUD — full logic is trivial enough not to warrant separate files) ---

export async function listBrands() {
  return db.brand.findMany({ orderBy: { name: 'asc' } })
}
export async function createBrand(data: { name: string; slug: string; description?: string; logoPublicId?: string; logoUrl?: string; tagline?: string; country?: string; foundedYear?: number; visibility?: ProductVisibility }) {
  const brand = await db.brand.create({ data })
  return brand
}
export async function updateBrand(id: string, data: Partial<{ name: string; slug: string; description: string; logoPublicId: string; logoUrl: string; tagline: string; country: string; foundedYear: number; visibility: ProductVisibility }>) {
  const brand = await db.brand.update({ where: { id }, data })
  return brand
}
export async function deleteBrand(id: string) {
  const brand = await db.brand.delete({ where: { id } })
  return brand
}

export async function listCategories() {
  return db.category.findMany({ orderBy: { name: 'asc' } })
}
export async function createCategory(data: { name: string; slug: string; description?: string; imageUrl?: string; visibility?: ProductVisibility }) {
  const category = await db.category.create({ data })
  return category
}
export async function updateCategory(id: string, data: Partial<{ name: string; slug: string; description: string; imageUrl: string; visibility: ProductVisibility }>) {
  const category = await db.category.update({ where: { id }, data })
  return category
}
export async function deleteCategory(id: string) {
  const category = await db.category.delete({ where: { id } })
  return category
}

export async function listCollections() {
  return db.collection.findMany({ orderBy: { name: 'asc' } })
}
export async function createCollection(data: { name: string; slug: string; description?: string; tagline?: string; imageUrl?: string; visibility?: ProductVisibility }) {
  const collection = await db.collection.create({ data })
  return collection
}
export async function updateCollection(id: string, data: Partial<{ name: string; slug: string; description: string; tagline: string; imageUrl: string; visibility: ProductVisibility }>) {
  const collection = await db.collection.update({ where: { id }, data })
  return collection
}
export async function deleteCollection(id: string) {
  const collection = await db.collection.delete({ where: { id } })
  return collection
}
