import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, Truck, RefreshCcw, Sparkles } from 'lucide-react'
import { Breadcrumb } from '@/components/site/breadcrumb'

export const metadata: Metadata = {
  title: 'About',
  description:
    'The Scent Lab is a curated marketplace of authentic fragrances from the world’s finest houses. Curated Fragrances. Authentic Brands.',
}

const VALUES = [
  {
    icon: ShieldCheck,
    title: '100% Authentic',
    body: 'Every bottle sourced directly from authorized houses. Guaranteed genuine, every time.',
  },
  {
    icon: Truck,
    title: 'Fast, free shipping',
    body: 'Complimentary worldwide shipping on orders over $100, delivered in 2–4 days.',
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

export default function AboutPage() {
  return (
    <div>
      <section className="border-b border-border py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">Our story</p>
          <h1 className="mt-3 font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl md:text-6xl">
            A calm place to discover the world’s finest fragrances.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            The Scent Lab was founded on a simple belief: finding your signature
            scent should feel effortless, not overwhelming.
          </p>
        </div>
      </section>

      <section className="border-b border-border py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border">
            <Image
              src="/images/journal-2.png"
              alt="The perfumer's atelier"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="font-display text-3xl font-medium leading-tight">Why we started</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                We curate authentic perfumes from the most respected houses on
                earth — from heritage maisons to independent niche ateliers — and
                present them with clarity and care.
              </p>
              <p>
                No noise, no clutter, no knock-offs. Just genuine fragrance,
                beautifully presented and delivered to your door. Every scent we
                carry has earned its place.
              </p>
              <p>
                We believe fragrance is one of life's quiet pleasures — a way to
                feel more like yourself, and to leave a trace of your presence in
                the rooms you pass through.
              </p>
            </div>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
            >
              Explore the edit
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">What we stand for</p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">Our promises</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-xl border border-border bg-card p-6">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-surface text-brand">
                  <v.icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <h3 className="mt-4 text-sm font-semibold">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
