'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ShieldCheck, Truck, RefreshCcw, Sparkles } from 'lucide-react'

const VALUES = [
  {
    icon: ShieldCheck,
    title: '100% Authentic',
    body: 'Every bottle sourced directly from authorized houses. Guaranteed genuine, every time.',
  },
  {
    icon: Truck,
    title: 'Fast Cambodia delivery',
    body: 'Free Phnom Penh delivery over US$100. Province delivery via VET Express & J&T Express.',
  },
  {
    icon: RefreshCcw,
    title: 'Easy returns',
    body: 'Changed your mind? Return within 30 days for a full refund — no questions asked.',
  },
  {
    icon: Sparkles,
    title: 'Expertly curated',
    body: 'Our team of fragrance obsessives hand-picks every scent we carry. No filler.',
  },
]

export function AboutSection() {
  return (
    <section id="about" className="border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border"
          >
            <Image
              src="/images/journal-2.png"
              alt="The perfumer's atelier"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
              Our story
            </p>
            <h2 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
              A calm place to discover
              <br />
              the world's finest fragrances.
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                The Scent Lab was founded on a simple belief: finding your
                signature scent should feel effortless, not overwhelming. We curate
                authentic perfumes from the most respected houses on earth — from
                heritage maisons to independent niche ateliers — and present them
                with clarity and care.
              </p>
              <p>
                No noise, no clutter, no knock-offs. Just genuine fragrance,
                beautifully presented and delivered to your door. Every scent we
                carry has earned its place.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Values */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-surface text-brand">
                <v.icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <h3 className="mt-4 text-sm font-semibold">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {v.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
