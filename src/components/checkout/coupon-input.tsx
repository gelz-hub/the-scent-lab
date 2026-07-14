'use client'

import * as React from 'react'
import { Check, Tag, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useStore, cartSubtotal } from '@/lib/store'

export function CouponInput() {
  const cart = useStore((s) => s.cart)
  const promo = useStore((s) => s.promo)
  const applyPromo = useStore((s) => s.applyPromo)
  const removePromo = useStore((s) => s.removePromo)

  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [applying, setApplying] = React.useState(false)

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setApplying(true)
    const result = await applyPromo(code, cartSubtotal(cart))
    setApplying(false)
    if (result.ok) {
      setError(null)
      setCode('')
    } else {
      setError(result.error ?? 'That code isn\'t valid or has expired.')
    }
  }

  if (promo) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Check className="h-3.5 w-3.5 text-success" /> {promo.code} applied
        </span>
        <button
          type="button"
          onClick={removePromo}
          aria-label="Remove coupon"
          className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleApply} className="space-y-1.5">
      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border px-3">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              setError(null)
            }}
            placeholder="Coupon code"
            aria-invalid={!!error}
            className="h-10 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <Button type="submit" variant="outline" disabled={applying || !code.trim()} className="shrink-0">
          {applying ? 'Checking…' : 'Apply'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </form>
  )
}
