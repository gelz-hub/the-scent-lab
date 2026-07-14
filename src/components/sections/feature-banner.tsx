'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function FeatureBanner() {
  return (
    <section className="relative overflow-hidden bg-[#111111] py-20 sm:py-28">
      {/* Subtle gradient texture */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(95,175,146,0.15),transparent_70%)]" />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/60 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
            The Scent Lab Philosophy
          </span>

          <h2 className="mt-6 font-display text-4xl font-medium leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
            Every fragrance
            <br />
            <span className="italic text-[#5faf92]">
              tells a story.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/60">
            We believe scent is the most intimate form of self-expression.
            That&apos;s why we curate only authentic, exceptional fragrances — so
            you can find the one that speaks for you.
          </p>

          <Link
            href="/about"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3.5 text-sm font-medium text-white backdrop-blur transition-all duration-300 hover:bg-white/20 hover:gap-3"
          >
            Our story
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
