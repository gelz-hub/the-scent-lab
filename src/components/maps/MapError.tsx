import { AlertTriangle } from 'lucide-react'

interface MapErrorProps {
  message: string
  className?: string
}

/** Friendly, non-blocking error banner — manual entry always remains available alongside this. */
export function MapError({ message, className }: MapErrorProps) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400 ${className ?? ''}`}
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
      <span>{message}</span>
    </div>
  )
}
