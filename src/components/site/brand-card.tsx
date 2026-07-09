'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { Brand } from '@/lib/data'

export function BrandCard({ brand, index = 0 }: { brand: Brand; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        href={`/brands/${brand.slug}`}
        className="group flex flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center transition-colors duration-200 hover:border-foreground/25"
      >
        <h3 className="font-display text-2xl font-medium tracking-tight transition-colors group-hover:text-brand">
          {brand.name}
        </h3>
        <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
          {brand.country} · est. {brand.founded}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {brand.tagline}
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-foreground">
          {brand.productCount} {brand.productCount === 1 ? 'fragrance' : 'fragrances'}
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
        </span>
      </Link>
    </motion.div>
  )
}

export function BrandCardImage({ brand, index = 0 }: { brand: Brand; index?: number }) {
  // image-style brand card using first product image as the visual
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        href={`/brands/${brand.slug}`}
        className="group relative block aspect-[3/4] overflow-hidden rounded-xl border border-border bg-surface"
      >
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <span className="font-display text-3xl font-medium tracking-tight text-foreground/70 transition-colors group-hover:text-brand">
            {brand.name}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {brand.country}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">{brand.tagline}</p>
        </div>
      </Link>
    </motion.div>
  )
}
