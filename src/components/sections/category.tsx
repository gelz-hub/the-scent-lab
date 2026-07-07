'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { categories } from '@/lib/data'

export function CategorySection() {
  return (
    <section className="border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
              Browse
            </p>
            <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
              Shop by category
            </h2>
          </div>
          <a
            href="#shop"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            View all →
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {categories.map((cat, i) => (
            <motion.a
              key={cat.slug}
              href="#shop"
              id={cat.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative block aspect-[4/5] overflow-hidden rounded-xl border border-border bg-surface"
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-contain p-8 transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="font-display text-2xl font-medium">{cat.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{cat.description}</p>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-background/90 text-foreground backdrop-blur transition-transform duration-200 group-hover:rotate-45">
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
