import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Truck, ShieldCheck, RefreshCcw, ChevronRight } from 'lucide-react'
import {
  getProduct,
  products,
  productFAQs,
  relatedProducts,
  type Product,
} from '@/lib/data'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { StarRating } from '@/components/site/star-rating'
import { ProductCard } from '@/components/site/product-card'
import { ProductDetailClient, ProductActions } from './product-detail-client'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) return { title: 'Product not found' }
  return {
    title: `${product.brand} ${product.name}`,
    description: product.description,
  }
}

function PerfBars({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-6 rounded-full ${i <= value ? 'bg-brand' : 'bg-border'}`}
          />
        ))}
      </div>
    </div>
  )
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) notFound()

  const related = relatedProducts(product, 4)

  return (
    <div>
      <ProductDetailClient product={product} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shop', href: '/shop' },
            { label: product.brand, href: `/brands/${product.brandSlug}` },
            { label: product.name },
          ]}
        />

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface">
              <Image
                src={product.image}
                alt={`${product.brand} ${product.name}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-8"
              />
            </div>
            {/* Thumbnails (same image, but shows gallery pattern) */}
            <div className="mt-3 grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-lg border border-border bg-surface"
                >
                  <Image
                    src={product.image}
                    alt={`${product.brand} ${product.name} view ${i + 1}`}
                    fill
                    sizes="120px"
                    className={`object-contain p-3 transition-opacity ${i === 0 ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="lg:pt-2">
            <Link
              href={`/brands/${product.brandSlug}`}
              className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {product.brand}
            </Link>
            <h1 className="mt-1 font-display text-3xl font-medium leading-tight sm:text-4xl">
              {product.name}
            </h1>
            <div className="mt-3 flex items-center gap-2">
              <StarRating rating={product.rating} size={16} showValue count={product.reviewCount} />
            </div>

            {/* Availability */}
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={`h-1.5 w-1.5 rounded-full ${product.stock > 0 ? 'bg-success' : 'bg-danger'}`}
              />
              {product.stock > 0 ? (
                <span>In stock · {product.stock} ready to ship</span>
              ) : (
                <span>Out of stock</span>
              )}
            </div>

            {/* Description */}
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            {/* Story */}
            <div className="mt-5 rounded-lg bg-surface/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                The story
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                {product.story}
              </p>
            </div>

            {/* Trust badges */}
            <div className="mt-5 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
              <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-center">
                <Truck className="h-4 w-4 text-brand" strokeWidth={1.5} />
                Free PP delivery over $100
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-center">
                <ShieldCheck className="h-4 w-4 text-brand" strokeWidth={1.5} />
                100% authentic
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-center">
                <RefreshCcw className="h-4 w-4 text-brand" strokeWidth={1.5} />
                30-day returns
              </div>
            </div>

            {/* Actions (client) */}
            <ProductActions product={product} />
            {/* Meta */}
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-6 text-xs">
              {[
                ['Gender', product.gender],
                ['Type', product.category],
                ['Origin', product.country],
                ['Launched', String(product.year)],
                ['Season', product.seasons.join(', ')],
                ['Occasion', product.occasions.join(', ')],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-right font-medium text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fragrance notes + Performance */}
        <div className="mt-16 grid gap-10 lg:grid-cols-2">
          {/* Notes */}
          <div>
            <h2 className="font-display text-2xl font-medium">Fragrance pyramid</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The three-layer structure that defines how this scent unfolds.
            </p>
            <div className="mt-6 space-y-5">
              {([
                ['Top Notes', product.notes.top, 'The opening — what you smell first, fading within minutes.'],
                ['Heart Notes', product.notes.heart, 'The character — the core of the fragrance, emerging after the tops fade.'],
                ['Base Notes', product.notes.base, 'The foundation — rich molecules that linger for hours.'],
              ] as const).map(([label, notes, help]) => (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{help}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {notes.map((n) => (
                      <span key={n} className="rounded-full bg-surface px-3 py-1.5 text-xs text-foreground">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance */}
          <div>
            <h2 className="font-display text-2xl font-medium">Performance</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              How this fragrance behaves on the skin, based on customer reviews.
            </p>
            <div className="mt-6 space-y-4">
              <PerfBars label="Longevity" value={product.longevity} />
              <PerfBars label="Projection" value={product.projection} />
              <PerfBars label="Sillage" value={product.sillage} />
            </div>
            <div className="mt-8 rounded-lg border border-border p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Best for
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.seasons.map((s) => (
                  <span key={s} className="rounded-full bg-surface px-3 py-1.5 text-xs">{s}</span>
                ))}
                {product.occasions.map((o) => (
                  <span key={o} className="rounded-full border border-border px-3 py-1.5 text-xs">{o}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-medium">Customer reviews</h2>
              <div className="mt-2 flex items-center gap-2">
                <StarRating rating={product.rating} size={14} showValue count={product.reviewCount} />
              </div>
            </div>
          </div>
          {product.reviews.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {product.reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{r.author}</span>
                    <StarRating rating={r.rating} size={12} />
                  </div>
                  <p className="mt-2 text-sm font-medium text-foreground">{r.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{r.date}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No reviews yet. Be the first to share your thoughts.</p>
          )}
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-medium">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="rounded-xl border border-border">
            {productFAQs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b border-border last:border-b-0">
                <AccordionTrigger className="px-5 text-left text-sm font-medium hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="px-5 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="font-display text-2xl font-medium">You may also like</h2>
              <Link
                href="/shop"
                className="group inline-flex items-center gap-1.5 text-sm font-medium"
              >
                View all
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
