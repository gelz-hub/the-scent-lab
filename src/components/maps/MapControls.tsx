'use client'

import { LocateFixed, Loader2 } from 'lucide-react'

interface MapControlsProps {
  onRecenter: () => void
  locating?: boolean
}

/** Floating overlay controls rendered on top of the map. Zoom/pan use Leaflet's native controls. */
export function MapControls({ onRecenter, locating }: MapControlsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[400]">
      <button
        type="button"
        onClick={onRecenter}
        disabled={locating}
        aria-label="Center map on my location"
        className="pointer-events-auto absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full border border-border bg-background/95 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-surface disabled:opacity-60"
      >
        {locating ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
        ) : (
          <LocateFixed className="h-4 w-4" strokeWidth={1.5} />
        )}
      </button>
    </div>
  )
}
