import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { collectionDetails } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Collections',
  description:
    'Explore our curated fragrance collections — Luxury, Niche, Fresh, Woody, Office, Summer, Winter, Date Night, Gift Sets and Travel Size.',
}

export default function CollectionsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Collections' }]} />
      <div className="mb-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
          Curated edits
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Collections
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Ten considered edits — from the world's most coveted flacons to
          season-ready selections and ready-to-gift sets.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collectionDetails.map((c) => (
          <Link
            key={c.slug}
            href={`/collections/${c.slug}`}
            className="group relative block aspect-[4/5] overflow-hidden rounded-xl border border-border"
          >
            <Image
              src={c.image}
              alt={c.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
                {c.tagline}
              </p>
              <h3 className="mt-1 font-display text-2xl font-medium">{c.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/80">
                {c.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium">
                Explore
                <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
