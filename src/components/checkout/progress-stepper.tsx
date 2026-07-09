'use client'

import { cn } from '@/lib/utils'

export interface StepDef {
  key: string
  label: string
}

interface ProgressStepperProps {
  steps: readonly StepDef[]
  currentKey: string
  onStepClick?: (key: string) => void
  className?: string
}

export function ProgressStepper({ steps, currentKey, onStepClick, className }: ProgressStepperProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentKey)

  return (
    <nav aria-label="Checkout progress" className={cn('flex items-center gap-2 overflow-x-auto', className)}>
      {steps.map((s, i) => {
        const reachable = i <= currentIndex
        const active = s.key === currentKey
        const done = i < currentIndex
        return (
          <div key={s.key} className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => reachable && onStepClick?.(s.key)}
              disabled={!reachable}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex items-center gap-2 text-sm font-medium transition-colors',
                active ? 'text-foreground' : reachable ? 'text-muted-foreground hover:text-foreground' : 'cursor-default text-muted-foreground/50'
              )}
            >
              <span
                className={cn(
                  'grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs transition-colors',
                  active && 'border-foreground bg-foreground text-background',
                  done && !active && 'border-brand bg-brand text-brand-foreground',
                  !active && !done && 'border-border'
                )}
              >
                {i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && <span className="h-px w-4 shrink-0 bg-border sm:w-8" />}
          </div>
        )
      })}
    </nav>
  )
}
