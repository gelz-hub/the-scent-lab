import Link from 'next/link'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onClick?: () => void
  className?: string
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onClick,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center',
        className
      )}
    >
      <p className="font-display text-xl">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onClick && !actionHref && (
        <button
          onClick={onClick}
          className="mt-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
