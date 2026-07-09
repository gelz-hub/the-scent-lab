'use client'

import Link from 'next/link'
import { brands } from '@/lib/data'

export function BrandMarquee() {
  const list = [...brands, ...brands]
  return (
    <section className="border-b border-border bg-surface/40 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="mb-8 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Authentic fragrances from the world&apos;s finest houses
        </p>
        <div className="group relative overflow-hidden">
          <div className="flex w-max items-center gap-14 animate-marquee group-hover:[animation-play-state:paused]">
            {list.map((b, i) => (
              <Link
                key={`${b.slug}-${i}`}
                href={`/brands/${b.slug}`}
                className="relative shrink-0 font-display text-3xl font-medium tracking-tight text-foreground/40 transition-all duration-500 hover:text-foreground hover:scale-110"
                title={`${b.name} · ${b.country}`}
              >
                {b.name}
              </Link>
            ))}
          </div>
          {/* fade edges — wider for larger typography */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-surface/80 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-surface/80 to-transparent" />
        </div>
      </div>
    </section>
  )
}
