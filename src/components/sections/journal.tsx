'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { journal } from '@/lib/data'
import { SectionHeading } from '@/components/site/section-heading'

export function JournalSection() {
  const [feature, ...rest] = journal
  return (
    <section id="journal" className="border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="The Journal"
          title="Stories on scent"
          description="Guides, house histories and the craft of perfumery — read at your leisure."
          action={{ label: 'All articles', href: '#journal' }}
          className="mb-10"
        />

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Feature */}
          <motion.a
            href="#journal"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className="group relative block overflow-hidden rounded-xl border border-border"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-surface">
              <Image
                src={feature.image}
                alt={feature.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium uppercase tracking-wider text-brand">
                  {feature.category}
                </span>
                <span>·</span>
                <span>{feature.date}</span>
                <span>·</span>
                <span>{feature.readTime}</span>
              </div>
              <h3 className="mt-3 font-display text-2xl font-medium leading-tight transition-colors group-hover:text-brand">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.excerpt}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium">
                Read article
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
              </span>
            </div>
          </motion.a>

          {/* Side list */}
          <div className="flex flex-col gap-5">
            {rest.map((post, i) => (
              <motion.a
                key={post.id}
                href="#journal"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: (i + 1) * 0.08 }}
                className="group grid grid-cols-[120px_1fr] gap-4 overflow-hidden rounded-xl border border-border p-3 sm:grid-cols-[160px_1fr]"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-surface">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="160px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-medium uppercase tracking-wider text-brand">
                      {post.category}
                    </span>
                    <span>·</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 className="mt-1.5 font-display text-lg font-medium leading-tight transition-colors group-hover:text-brand">
                    {post.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
