'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { collections } from '@/lib/data'

export function CollectionSection() {
  return (
    <section id="collections" className="border-b border-border bg-surface/40 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
            Curated edits
          </p>
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl md:text-[2.75rem]">
            Collections for every inclination
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            Three considered edits — from the world's most coveted flacons to
            singular artisan houses and ready-to-gift sets.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {collections.map((c, i) => (
            <motion.a
              key={c.slug}
              href="#shop"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group relative block aspect-[3/4] overflow-hidden rounded-xl border border-border"
            >
              <Image
                src={c.image}
                alt={c.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
                  {c.tagline}
                </p>
                <h3 className="mt-1 font-display text-2xl font-medium">{c.name}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/80">
                  {c.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium">
                  Discover
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
