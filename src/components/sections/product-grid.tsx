'use client'

import { motion } from 'framer-motion'
import { products, type Product } from '@/lib/data'
import { ProductCard } from '@/components/site/product-card'
import { SectionHeading } from '@/components/site/section-heading'

interface ProductGridSectionProps {
  id: string
  eyebrow: string
  title: string
  description?: string
  productIds?: string[]
  tag?: Product['tags'][number]
  limit?: number
  action?: { label: string; href: string }
  columns?: 3 | 4
}

export function ProductGridSection({
  id,
  eyebrow,
  title,
  description,
  productIds,
  tag,
  limit,
  action,
  columns = 4,
}: ProductGridSectionProps) {
  let list = productIds
    ? productIds.map((pid) => products.find((p) => p.id === pid)!).filter(Boolean)
    : products
  if (tag) list = list.filter((p) => p.tags.includes(tag))
  if (limit) list = list.slice(0, limit)

  const cols =
    columns === 3
      ? 'sm:grid-cols-2 lg:grid-cols-3'
      : 'sm:grid-cols-2 lg:grid-cols-4'

  return (
    <section id={id} className="border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          action={action}
          className="mb-10"
        />
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className={`grid grid-cols-2 gap-4 sm:gap-5 ${cols}`}
        >
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
