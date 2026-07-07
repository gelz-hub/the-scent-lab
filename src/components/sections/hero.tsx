'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

export function HeroSection() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-border">
      <div className="mx-auto grid max-w-7xl items-center gap-0 px-4 sm:px-6 lg:grid-cols-2">
        {/* Copy */}
        <div className="order-2 py-14 lg:order-1 lg:py-24 lg:pr-12">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-brand"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
            Curated · Authentic · Worldwide
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-6xl md:text-7xl"
          >
            Discover your
            <br />
            <span className="italic text-brand">signature</span> scent.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground"
          >
            A considered edit of authentic fragrances from the world's finest
            houses — Dior, Chanel, Tom Ford, Creed, Le Labo and beyond. No noise.
            Just scent.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a
              href="#shop"
              className="group inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3.5 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
            >
              Shop the edit
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </a>
            <a
              href="#collections"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3.5 text-sm font-medium transition-colors hover:border-foreground/40"
            >
              Explore collections
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex gap-8 border-t border-border pt-6"
          >
            {[
              ['120+', 'Houses'],
              ['1,800+', 'Fragrances'],
              ['100%', 'Authentic'],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-2xl font-medium">{n}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{l}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Image */}
        <div className="relative order-1 aspect-[4/3] lg:order-2 lg:aspect-auto lg:h-[640px]">
          <Image
            src="/images/hero-1.png"
            alt="A single elegant perfume bottle on a travertine pedestal"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
