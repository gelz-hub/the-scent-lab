'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { products } from '@/lib/data'
import { ProductCard } from '@/components/site/product-card'
import { SectionHeading } from '@/components/site/section-heading'

export function RecentlyViewed() {
  const ids = useStore((s) => s.recentlyViewed)
  const list = ids
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, 4)

  if (list.length === 0) return null

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
            key={list.map((p) => p!.id).join('-')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
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
