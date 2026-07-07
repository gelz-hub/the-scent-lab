'use client'

import Link from 'next/link'
import { brands } from '@/lib/data'

export function BrandMarquee() {
  const list = [...brands, ...brands]
  return (
    <section className="border-b border-border bg-surface/50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="mb-6 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Authentic fragrances from the world's finest houses
        </p>
        <div className="group relative overflow-hidden">
          <div className="flex w-max items-center gap-12 animate-[marquee_40s_linear_infinite] group-hover:[animation-play-state:paused]">
            {list.map((b, i) => (
              <Link
                key={b.slug + i}
                href={`/brands/${b.slug}`}
                className="shrink-0 font-display text-2xl font-medium tracking-tight text-foreground/55 transition-colors duration-200 hover:text-foreground"
                title={`${b.name} · ${b.country}`}
              >
                {b.name}
              </Link>
            ))}
          </div>
          {/* fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-surface to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-surface to-transparent" />
        </div>
      </div>
    </section>
  )
}
