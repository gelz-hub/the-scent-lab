'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { CatalogCollection } from '@/lib/catalog'
import { SectionHeading } from '@/components/site/section-heading'

export function CollectionSection({ collections }: { collections: CatalogCollection[] }) {
  if (collections.length === 0) return null

  return (
    <section className="section-divider-soft bg-surface/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Curated edits"
          title="Collections for every inclination"
          description="Considered edits, curated by our team."
          action={{ label: 'All collections', href: '/collections' }}
          className="mb-10"
        />

        <div className="grid gap-5 md:grid-cols-3">
          {collections.slice(0, 3).map((c, i) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.6,
                delay: i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link
                href={`/collections/${c.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-shadow duration-300 hover:shadow-xl"
              >
                {c.image ? (
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-surface to-border" />
                )}
                {/* Deeper, richer gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  {c.tagline && (
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">
                      {c.tagline}
                    </p>
                  )}
                  <h3 className="mt-1 font-display text-2xl font-medium sm:text-3xl">
                    {c.name}
                  </h3>
                  {c.description && (
                    <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/80">
                      {c.description}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white">
                    Discover
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      strokeWidth={1.5}
                    />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
