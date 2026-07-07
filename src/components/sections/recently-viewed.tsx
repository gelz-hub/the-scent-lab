'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { products } from '@/lib/data'
import { ProductCard } from '@/components/site/product-card'

export function RecentlyViewed() {
  const ids = useStore((s) => s.recentlyViewed)
  const list = ids
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, 4)

  if (list.length === 0) return null

  return (
    <section className="border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
            Pick up where you left off
          </p>
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Recently viewed
          </h2>
        </div>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={list.map((p) => p!.id).join('-')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4"
          >
            {list.map((p, i) => (
              <ProductCard key={p!.id} product={p!} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
