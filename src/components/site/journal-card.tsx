'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { JournalPost } from '@/lib/data'

export function JournalCard({
  post,
  index = 0,
  variant = 'default',
}: {
  post: JournalPost
  index?: number
  variant?: 'default' | 'compact'
}) {
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.4, delay: index * 0.06 }}
      >
        <Link
          href={`/journal/${post.id === 'j1' ? 'how-to-find-your-signature-scent' : post.id === 'j2' ? 'inside-the-perfumers-atelier' : post.id === 'j3' ? 'understanding-fragrance-notes' : post.id === 'j4' ? 'how-to-store-your-perfume' : post.id === 'j5' ? 'art-of-layering-fragrance' : 'brief-history-of-niche-perfumery'}`}
          className="group grid grid-cols-[100px_1fr] gap-3 overflow-hidden rounded-xl border border-border p-3 sm:grid-cols-[140px_1fr]"
        >
          <div className="relative aspect-square overflow-hidden rounded-lg bg-surface">
            <Image
              src={post.image}
              alt={post.title}
              fill
              sizes="140px"
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
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link
        href={`/journal/${post.id === 'j1' ? 'how-to-find-your-signature-scent' : post.id === 'j2' ? 'inside-the-perfumers-atelier' : post.id === 'j3' ? 'understanding-fragrance-notes' : post.id === 'j4' ? 'how-to-store-your-perfume' : post.id === 'j5' ? 'art-of-layering-fragrance' : 'brief-history-of-niche-perfumery'}`}
        className="group block overflow-hidden rounded-xl border border-border"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-surface">
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium uppercase tracking-wider text-brand">
              {post.category}
            </span>
            <span>·</span>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
          <h3 className="mt-3 font-display text-xl font-medium leading-tight transition-colors group-hover:text-brand">
            {post.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium">
            Read article
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
          </span>
        </div>
      </Link>
    </motion.div>
  )
}
