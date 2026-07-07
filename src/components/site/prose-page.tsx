import type { ReactNode } from 'react'
import { Breadcrumb } from '@/components/site/breadcrumb'
import type { Crumb } from '@/lib/data'

interface ProsePageProps {
  title: string
  eyebrow?: string
  description?: string
  crumbs: Crumb[]
  children: ReactNode
}

export function ProsePage({ title, eyebrow, description, crumbs, children }: ProsePageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Breadcrumb items={crumbs} />
      {eyebrow && (
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
      )}
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">{title}</h1>
      {description && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/80 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:text-foreground [&_li]:ml-4 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
    </div>
  )
}
