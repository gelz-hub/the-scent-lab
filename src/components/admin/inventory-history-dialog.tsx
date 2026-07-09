'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { productStatusLabel } from '@/lib/inventory/config'
import type { AdminInventoryVariant } from '@/app/admin/inventory/inventory-client'

interface Movement {
  id: string
  type: string
  quantity: number
  previousStock: number
  newStock: number
  reason: string | null
  referenceId: string | null
  createdAt: string
  createdBy: { name: string | null } | null
}

interface InventoryHistoryDialogProps {
  variant: AdminInventoryVariant | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InventoryHistoryDialog({ variant, open, onOpenChange }: InventoryHistoryDialogProps) {
  const [movements, setMovements] = React.useState<Movement[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open || !variant) return
    setLoading(true)
    fetch(`/api/admin/inventory/${variant.id}/history`)
      .then((res) => res.json())
      .then((data) => setMovements(data.movements ?? []))
      .catch(() => toast.error('Could not load history'))
      .finally(() => setLoading(false))
  }, [open, variant])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Inventory history</DialogTitle>
          <DialogDescription>{variant ? `${variant.product.name} · ${variant.sku}` : ''}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={1.5} />
          </div>
        ) : movements.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No movements recorded yet.</p>
        ) : (
          <ul className="max-h-[60vh] space-y-3 overflow-y-auto border-l border-border pl-4 text-sm">
            {movements.map((m) => (
              <li key={m.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-brand" />
                <p className="font-medium">
                  {productStatusLabel(m.type)}{' '}
                  <span className={m.quantity >= 0 ? 'text-success' : 'text-danger'}>
                    {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.previousStock} → {m.newStock}
                  {m.reason ? ` · ${m.reason}` : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(m.createdAt).toLocaleString()}
                  {m.createdBy?.name ? ` · ${m.createdBy.name}` : ''}
                  {m.referenceId ? ` · ref: ${m.referenceId}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
