import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { articleBySlug, journalArticles } from '@/lib/data'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return journalArticles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = articleBySlug(slug)
  if (!article) return { title: 'Article not found' }
  return {
    title: article.title,
    description: article.excerpt,
  }
}

export default async function JournalArticlePage({ params }: PageProps) {
  const { slug } = await params
  const article = articleBySlug(slug)
  if (!article) notFound()

  const more = journalArticles.filter((a) => a.slug !== slug).slice(0, 2)

  return (
    <article>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <Link
            href="/journal"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Back to Journal
          </Link>
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium uppercase tracking-wider text-brand">
              {article.category}
            </span>
            <span>·</span>
            <span>{article.date}</span>
            <span>·</span>
            <span>{article.readTime}</span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {article.excerpt}
          </p>
          <p className="mt-6 text-xs text-muted-foreground">By {article.author}</p>
        </div>
      </section>

      {/* Cover image */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border">
          <Image
            src={article.image}
            alt={article.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Journal', href: '/journal' },
            { label: article.title },
          ]}
        />
        <div className="space-y-6">
          {article.body.map((para, i) => (
            <p key={i} className="text-[17px] leading-relaxed text-foreground/90">
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* More articles */}
      {more.length > 0 && (
        <section className="border-t border-border bg-surface/40 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="mb-8 font-display text-2xl font-medium">Keep reading</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {more.map((p, i) => (
                <JournalCardLink key={p.slug} slug={p.slug} title={p.title} excerpt={p.excerpt} image={p.image} category={p.category} readTime={p.readTime} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  )
}

function JournalCardLink({
  slug,
  title,
  excerpt,
  image,
  category,
  readTime,
  index,
}: {
  slug: string
  title: string
  excerpt: string
  image: string
  category: string
  readTime: string
  index: number
}) {
  return (
    <Link
      href={`/journal/${slug}`}
      className="group grid grid-cols-[140px_1fr] gap-4 overflow-hidden rounded-xl border border-border bg-card p-3"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface">
        <Image src={image} alt={title} fill sizes="140px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium uppercase tracking-wider text-brand">{category}</span>
          <span>·</span>
          <span>{readTime}</span>
        </div>
        <h3 className="mt-1.5 font-display text-lg font-medium leading-tight transition-colors group-hover:text-brand">
          {title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {excerpt}
        </p>
      </div>
    </Link>
  )
}
