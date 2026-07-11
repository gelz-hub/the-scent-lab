'use client'

import { motion } from 'framer-motion'
import type { Product } from '@/lib/data'
import { ProductCard } from '@/components/site/product-card'
import { SectionHeading } from '@/components/site/section-heading'

interface ProductGridSectionProps {
  id?: string
  eyebrow: string
  title: string
  description?: string
  products: Product[]
  limit?: number
  action?: { label: string; href: string }
  className?: string
}

export function ProductGridSection({
  id,
  eyebrow,
  title,
  description,
  products,
  limit,
  action,
  className,
}: ProductGridSectionProps) {
  const list = limit ? products.slice(0, limit) : products
  if (list.length === 0) return null

  return (
    <section
      id={id}
      className={`section-divider-soft py-20 sm:py-28 ${className ?? ''}`}
    >
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
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
        >
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
