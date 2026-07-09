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
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MANUAL_ADJUSTMENT_TYPES, productStatusLabel } from '@/lib/inventory/config'
import type { AdminInventoryVariant } from '@/app/admin/inventory/inventory-client'

interface InventoryAdjustDialogProps {
  variant: AdminInventoryVariant | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdjusted: () => void
}

export function InventoryAdjustDialog({ variant, open, onOpenChange, onAdjusted }: InventoryAdjustDialogProps) {
  const [type, setType] = React.useState<string>('PURCHASE')
  const [quantity, setQuantity] = React.useState('')
  const [reason, setReason] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (variant) {
      setType('PURCHASE')
      setQuantity('')
      setReason('')
    }
  }, [variant])

  async function handleSave() {
    if (!variant) return
    const qty = Number(quantity)
    if (!qty || Number.isNaN(qty)) {
      toast.error('Enter a non-zero quantity.')
      return
    }
    if (!reason.trim()) {
      toast.error('A reason is required for every adjustment.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/inventory/${variant.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, quantity: qty, reason: reason.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not adjust stock.')
        return
      }
      toast.success('Stock adjusted')
      onAdjusted()
      onOpenChange(false)
    } catch {
      toast.error('Could not adjust stock.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            {variant ? `${variant.product.name} · ${variant.sku} — currently ${variant.currentStock} in stock` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Movement type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MANUAL_ADJUSTMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{productStatusLabel(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quantity (use a negative number to reduce stock)</Label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 50 or -3"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Received PO #1023 from supplier"
              className="mt-1.5"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
