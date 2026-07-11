'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import type { FeaturedReview } from '@/lib/catalog'

export function ReviewsSection({ reviews }: { reviews: FeaturedReview[] }) {
  if (reviews.length === 0) return null
  const [feature, ...grid] = reviews
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

  return (
    <section className="section-divider-soft py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* ── Header ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 flex flex-col items-center text-center"
        >
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
            Loved worldwide
          </p>
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
            What our customers say
          </h2>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {avg.toFixed(1)} / 5 · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        </motion.div>

        {/* ── Feature review (spans full width) ── */}
        {feature && (
          <motion.figure
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto mb-6 max-w-3xl overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10"
          >
            <Quote className="absolute right-8 top-8 h-16 w-16 text-brand/8" strokeWidth={1} />
            <div className="flex mb-4">
              {Array.from({ length: feature.rating }).map((_, j) => (
                <Star
                  key={j}
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <blockquote className="relative z-10 font-display text-xl font-medium leading-relaxed tracking-tight sm:text-2xl">
              &ldquo;{feature.body}&rdquo;
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-accent font-display text-lg font-medium text-brand">
                {feature.author.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-foreground">{feature.author}</p>
                <p className="text-sm text-muted-foreground">Verified purchase</p>
              </div>
            </figcaption>
          </motion.figure>
        )}

        {/* ── Grid reviews ─────────────────────── */}
        {grid.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((r, i) => (
              <motion.figure
                key={`${r.author}-${i}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
              >
                <Quote className="h-5 w-5 text-brand/20" strokeWidth={1.5} />
                <div className="mt-3 flex">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">
                  {r.title}
                </p>
                <blockquote className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{r.body}&rdquo;
                </blockquote>
                <figcaption className="mt-4 border-t border-border pt-3">
                  <p className="text-sm font-medium">{r.author}</p>
                  <p className="text-xs text-muted-foreground">Verified purchase</p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
