'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { customerReviews } from '@/lib/data'

export function ReviewsSection() {
  return (
    <section className="border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col items-center text-center">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
            Loved worldwide
          </p>
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl md:text-[2.75rem]">
            What our customers say
          </h2>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-foreground text-foreground" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              4.9 / 5 · 12,000+ reviews
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {customerReviews.map((r, i) => (
            <motion.figure
              key={r.author}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex flex-col rounded-xl border border-border bg-card p-6"
            >
              <Quote className="h-6 w-6 text-brand/30" strokeWidth={1.5} />
              <div className="mt-3 flex">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-foreground text-foreground" />
                ))}
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">{r.title}</p>
              <blockquote className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                "{r.body}"
              </blockquote>
              <figcaption className="mt-4 border-t border-border pt-3">
                <p className="text-sm font-medium">{r.author}</p>
                <p className="text-xs text-muted-foreground">{r.location}</p>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
