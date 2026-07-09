'use client'

import { cn } from '@/lib/utils'

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'custom', label: 'Custom Range' },
] as const

export interface RangeFilterValue {
  preset: string
  from?: string
  to?: string
}

export function RangeFilter({ value, onChange }: { value: RangeFilterValue; onChange: (v: RangeFilterValue) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange({ ...value, preset: p.key })}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            value.preset === p.key ? 'border-brand bg-brand text-brand-foreground' : 'border-border hover:border-foreground/40'
          )}
        >
          {p.label}
        </button>
      ))}
      {value.preset === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.from ?? ''}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={value.to ?? ''}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
          />
        </div>
      )}
    </div>
  )
}
