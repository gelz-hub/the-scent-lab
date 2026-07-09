'use client'

import { MapPin, Pencil } from 'lucide-react'

interface AddressPreviewCardProps {
  houseNumber?: string
  streetAddress: string
  district: string
  province: string
  onEdit?: () => void
  className?: string
}

export function AddressPreviewCard({
  houseNumber,
  streetAddress,
  district,
  province,
  onEdit,
  className,
}: AddressPreviewCardProps) {
  return (
    <div className={`rounded-lg border border-border bg-surface p-4 ${className ?? ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={1.5} />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Delivery address
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              {houseNumber && <span>{houseNumber}, </span>}
              {streetAddress}
              <br />
              {district}
              <br />
              {province}
              <br />
              Cambodia
            </p>
          </div>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <Pencil className="h-3 w-3" strokeWidth={1.5} />
            Edit
          </button>
        )}
      </div>
    </div>
  )
}
