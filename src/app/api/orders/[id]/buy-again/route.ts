import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import type { OrderItem } from '@prisma/client'

interface BuyAgainLine {
  productId: string
  slug: string | null
  name: string
  brand: string
  image: string
  ml: number
  qty: number
  /** Always the CURRENT price — never the price paid on the original order. */
  price: number
  available: boolean
  reason?: string
}

/**
 * Buy Again — rebuilds a previous order's line items using CURRENT product
 * data: current price (never the historical price paid), current variant/
 * inventory availability. Never creates an order itself; returns a
 * cart-ready payload for the client to push into the existing (unmodified)
 * zustand cart store — Checkout/Payment/Order creation are untouched.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const { id } = await params
  const order = await db.order.findUnique({ where: { id }, include: { items: true } })
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  if (order.userId !== session.user.id) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const lines: BuyAgainLine[] = []

  for (const item of order.items) {
    const product = await db.product.findFirst({ where: { id: item.productId, deletedAt: null } })
    if (!product) {
      lines.push({ ...toBase(item), available: false, reason: 'This product is no longer available.' })
      continue
    }

    // Prefer the Part 6 variant/inventory system if this product has been
    // migrated to it; fall back to the legacy volumes/stock fields
    // otherwise — either way, price and availability are read fresh, never
    // copied from the original order.
    const variant = await db.productVariant.findFirst({
      where: { productId: item.productId, volumeMl: item.ml, status: { not: 'ARCHIVED' } },
      include: { inventory: true },
    })

    if (variant) {
      const available = (variant.inventory?.currentStock ?? 0) - (variant.inventory?.reservedStock ?? 0) > 0
      lines.push({
        ...toBase(item, product.slug),
        price: variant.price,
        available,
        reason: available ? undefined : 'Currently out of stock.',
      })
      continue
    }

    const volumes = product.volumes as unknown as { ml: number; price: number }[]
    const legacyVolume = volumes.find((v) => v.ml === item.ml)
    if (!legacyVolume) {
      lines.push({ ...toBase(item, product.slug), available: false, reason: 'This size is no longer available.' })
      continue
    }

    lines.push({
      ...toBase(item, product.slug),
      price: legacyVolume.price,
      available: product.stock > 0,
      reason: product.stock > 0 ? undefined : 'Currently out of stock.',
    })
  }

  function toBase(item: OrderItem, slug: string | null = null) {
    return {
      productId: item.productId,
      slug,
      name: item.name,
      brand: item.brand,
      image: item.image,
      ml: item.ml,
      qty: item.qty,
      price: item.price, // overwritten above whenever the product/variant is still found
    }
  }

  const unavailableCount = lines.filter((l) => !l.available).length
  return NextResponse.json({ items: lines, unavailableCount })
}
