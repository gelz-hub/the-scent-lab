'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import type { Product } from '@/lib/data'
import { ProductCard } from '@/components/site/product-card'
import { SectionHeading } from '@/components/site/section-heading'

export function RecentlyViewed() {
  const ids = useStore((s) => s.recentlyViewed)
  const [products, setProducts] = React.useState<Product[]>([])

  React.useEffect(() => {
    if (ids.length === 0) {
      setProducts([])
      return
    }
    let cancelled = false
    fetch('/api/products?status=ACTIVE&visibility=PUBLIC')
      .then((res) => res.json())
      .then((data: { products?: Product[] }) => {
        if (cancelled) return
        const byId = new Map((data.products ?? []).map((p) => [p.id, p]))
        const list = ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p)).slice(0, 4)
        setProducts(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [ids])

  if (products.length === 0) return null

  return (
    <section className="section-divider-soft py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Pick up where you left off"
          title="Recently viewed"
          className="mb-10"
        />
        <AnimatePresence mode="popLayout">
          <motion.div
            key={products.map((p) => p.id).join('-')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
          >
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
