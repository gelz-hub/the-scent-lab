'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, Clock } from 'lucide-react'
import { journal, journalArticles } from '@/lib/data'
import { SectionHeading } from '@/components/site/section-heading'

const slugFor = (id: string) =>
  journalArticles.find((a) => a.id === id)?.slug ?? '#'

export function JournalSection() {
  const [feature, ...rest] = journal
  return (
    <section className="section-divider-soft py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="The Journal"
          title="Stories on scent"
          description="Guides, house histories and the craft of perfumery — read at your leisure."
          action={{ label: 'All articles', href: '/journal' }}
          className="mb-10"
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Feature article ──────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={`/journal/${slugFor(feature.id)}`}
              className="group block overflow-hidden rounded-2xl border border-border shadow-sm transition-shadow duration-300 hover:shadow-lg"
            >
              <div className="relative aspect-[16/8] overflow-hidden bg-surface">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-brand">
                    {feature.category}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" strokeWidth={1.5} />
                    {feature.readTime}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-2xl font-medium leading-tight transition-colors duration-200 group-hover:text-brand">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.excerpt}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium">
                  Read article
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={1.5}
                  />
                </span>
              </div>
            </Link>
          </motion.div>

          {/* ── Side list ────────────────────────── */}
          <div className="flex flex-col gap-5">
            {rest.slice(0, 3).map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.5,
                  delay: (i + 1) * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  href={`/journal/${slugFor(post.id)}`}
                  className="group grid grid-cols-[120px_1fr] gap-4 overflow-hidden rounded-2xl border border-border p-3 shadow-sm transition-all duration-300 hover:shadow-md sm:grid-cols-[160px_1fr]"
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-surface">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="160px"
                      className="object-cover transition-transform duration-500 ease-out-expo group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand">
                        {post.category}
                      </span>
                      <span>·</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="mt-1.5 font-display text-lg font-medium leading-tight transition-colors duration-200 group-hover:text-brand">
                      {post.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
