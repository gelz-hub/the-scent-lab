import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { notifyBackInStock, notifyPriceDrop } from '@/lib/notifications'
import type { VolumeOption } from '@/lib/data'
import { requirePermission } from '@/lib/rbac/require-permission'
import { recordAudit, requestMetadata } from '@/lib/audit/audit-service'

const productUpdateSchema = z.object({
  slug: z.string().trim().min(1).optional(),
  sku: z.string().trim().min(1).optional().nullable(),
  status: z.enum(['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED']).optional(),
  name: z.string().trim().min(1).optional(),
  brand: z.string().trim().min(1).optional(),
  brandSlug: z.string().trim().min(1).optional(),
  gender: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  collection: z.array(z.string()).optional(),
  image: z.string().trim().min(1).optional(),
  gallery: z.array(z.string()).optional(),
  volumes: z.array(z.object({ ml: z.number(), price: z.number() })).optional(),
  compareAtPrice: z.number().nullable().optional(),
  description: z.string().trim().optional(),
  story: z.string().trim().optional(),
  notes: z
    .object({
      top: z.array(z.string()),
      heart: z.array(z.string()),
      base: z.array(z.string()),
    })
    .optional(),
  longevity: z.number().min(1).max(5).optional(),
  projection: z.number().min(1).max(5).optional(),
  sillage: z.number().min(1).max(5).optional(),
  seasons: z.array(z.string()).optional(),
  occasions: z.array(z.string()).optional(),
  country: z.string().trim().optional(),
  year: z.number().optional(),
  tags: z.array(z.string()).optional(),
  stock: z.number().min(0).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, allowed } = await requirePermission('products', 'write')
  if (!allowed || !session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = productUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid product data.' }, { status: 400 })
  }

  const before = await db.product.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  if (parsed.data.sku && parsed.data.sku !== before.sku) {
    const existingSku = await db.product.findUnique({ where: { sku: parsed.data.sku } })
    if (existingSku && existingSku.id !== id) {
      return NextResponse.json({ error: 'A product with this SKU already exists.' }, { status: 409 })
    }
  }

  const product = await db.product.update({ where: { id }, data: parsed.data }).catch(() => null)
  if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

  const changedKeys = Object.keys(parsed.data) as (keyof typeof before)[]
  const beforeChanged = Object.fromEntries(changedKeys.map((k) => [k, before[k]]))
  const { ipAddress, userAgent } = requestMetadata(req)
  await recordAudit({
    userId: session.user.id,
    action: 'UPDATE',
    resource: 'Product',
    resourceId: id,
    before: beforeChanged,
    after: parsed.data,
    ipAddress,
    userAgent,
  })

  if (before.stock === 0 && product.stock > 0) {
    notifyBackInStock(product).catch((err) => console.error('notifyBackInStock failed', err))
  }

  const oldPrice = (before.volumes as unknown as VolumeOption[])[0]?.price
  const newPrice = (product.volumes as unknown as VolumeOption[])[0]?.price
  if (typeof oldPrice === 'number' && typeof newPrice === 'number' && newPrice < oldPrice) {
    notifyPriceDrop(product, oldPrice, newPrice).catch((err) => console.error('notifyPriceDrop failed', err))
  }

  return NextResponse.json({ product })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, allowed } = await requirePermission('products', 'write')
  if (!allowed || !session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const before = await db.product.findUnique({ where: { id } })
  await db.product.delete({ where: { id } }).catch(() => null)

  const { ipAddress, userAgent } = requestMetadata(req)
  await recordAudit({
    userId: session.user.id,
    action: 'DELETE',
    resource: 'Product',
    resourceId: id,
    before,
    ipAddress,
    userAgent,
  })

  return NextResponse.json({ ok: true })
}
