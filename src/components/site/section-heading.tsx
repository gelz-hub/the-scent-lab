'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  action?: { label: string; href: string }
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end',
        align === 'center' && 'sm:flex-col sm:items-center',
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn('flex-1', align === 'center' && 'text-center')}
      >
        {eyebrow && (
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-3xl font-medium leading-[1.1] tracking-tight sm:text-4xl md:text-[2.75rem]">
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              'mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]',
              align === 'center' && 'mx-auto'
            )}
          >
            {description}
          </p>
        )}
      </motion.div>
      {action && (
        <a
          href={action.href}
          className="group inline-flex items-center gap-1.5 self-start text-sm font-medium text-foreground sm:self-end"
        >
          {action.label}
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            strokeWidth={1.5}
          />
        </a>
      )}
    </div>
  )
}
