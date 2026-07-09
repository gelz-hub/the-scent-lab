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
  size?: 'sm' | 'default' | 'lg' | 'xl'
  action?: { label: string; href: string }
  className?: string
}

const titleSizes: Record<string, string> = {
  sm: 'font-display text-2xl font-medium leading-[1.15] tracking-tight sm:text-3xl',
  default:
    'font-display text-3xl font-medium leading-[1.1] tracking-tight sm:text-4xl md:text-[2.75rem]',
  lg: 'font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl md:text-6xl',
  xl: 'font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-6xl md:text-7xl',
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  size = 'default',
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end',
        align === 'center' && 'sm:flex-col sm:items-center',
        className,
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={cn('flex-1', align === 'center' && 'text-center')}
      >
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-brand"
          >
            {eyebrow}
          </motion.p>
        )}
        <h2 className={titleSizes[size]}>{title}</h2>
        {description && (
          <p
            className={cn(
              'mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]',
              align === 'center' && 'mx-auto',
            )}
          >
            {description}
          </p>
        )}
        {/* Decorative divider for centered headings */}
        {align === 'center' && (
          <div className="mx-auto mt-5 h-px w-12 bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
        )}
      </motion.div>
      {action && (
        <motion.a
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, delay: 0.15 }}
          href={action.href}
          className="group inline-flex items-center gap-1.5 self-start text-sm font-medium text-foreground transition-colors hover:text-brand sm:self-end"
        >
          {action.label}
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            strokeWidth={1.5}
          />
        </motion.a>
      )}
    </div>
  )
}
