import { Loader2 } from 'lucide-react'

interface MapLoadingProps {
  label?: string
  className?: string
}

export function MapLoading({ label = 'Loading map…', className }: MapLoadingProps) {
  return (
    <div
      className={`grid min-h-80 w-full place-items-center rounded-lg border border-border bg-surface lg:min-h-100 ${className ?? ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-xs">{label}</span>
      </div>
    </div>
  )
}
