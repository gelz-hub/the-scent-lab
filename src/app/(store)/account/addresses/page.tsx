'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { MapPin, Plus, Pencil, Trash2, Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { cn } from '@/lib/utils'

interface SavedAddress {
  id: string
  label: string
  recipientName: string
  phone: string
  province: string
  district: string
  commune: string | null
  streetAddress: string
  deliveryNote: string | null
  isDefault: boolean
}

const emptyForm = {
  label: '',
  recipientName: '',
  phone: '',
  province: '',
  district: '',
  commune: '',
  streetAddress: '',
  deliveryNote: '',
}

export default function AddressesPage() {
  const [addresses, setAddresses] = React.useState<SavedAddress[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<SavedAddress | null>(null)
  const [form, setForm] = React.useState(emptyForm)
  const [saving, setSaving] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/addresses')
      const data = await res.json()
      setAddresses(data.addresses ?? [])
    } catch {
      toast.error('Could not load addresses')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(a: SavedAddress) {
    setEditing(a)
    setForm({
      label: a.label,
      recipientName: a.recipientName,
      phone: a.phone,
      province: a.province,
      district: a.district,
      commune: a.commune ?? '',
      streetAddress: a.streetAddress,
      deliveryNote: a.deliveryNote ?? '',
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.label.trim() || !form.recipientName.trim() || !form.phone.trim() || !form.province.trim() || !form.district.trim() || !form.streetAddress.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }
    setSaving(true)
    try {
      const url = editing ? `/api/addresses/${editing.id}` : '/api/addresses'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not save address.')
        return
      }
      toast.success(editing ? 'Address updated' : 'Address saved')
      setDialogOpen(false)
      load()
    } catch {
      toast.error('Could not save address.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not delete address.')
        return
      }
      setAddresses((prev) => prev.filter((a) => a.id !== id))
      toast.success('Address deleted')
    } catch {
      toast.error('Could not delete address.')
    }
  }

  async function handleSetDefault(id: string) {
    try {
      const res = await fetch(`/api/addresses/${id}/default`, { method: 'POST' })
      if (!res.ok) {
        toast.error('Could not set default address.')
        return
      }
      load()
    } catch {
      toast.error('Could not set default address.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight">Saved addresses</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage the addresses you deliver to — pick one at checkout instead of retyping it.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
          Add address
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={1.5} />
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <MapPin className="mx-auto h-8 w-8" strokeWidth={1.25} />
          <p className="mt-3 text-sm">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className={cn('rounded-xl border p-5', a.isDefault ? 'border-brand' : 'border-border')}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.label}</span>
                  {a.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                      <Star className="h-3 w-3" strokeWidth={1.5} fill="currentColor" />
                      Default
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label={`Edit ${a.label}`} onClick={() => openEdit(a)}>
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Delete ${a.label}`} onClick={() => handleDelete(a.id)}>
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-sm font-medium">{a.recipientName} · {a.phone}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {a.streetAddress}, {a.commune ? `${a.commune}, ` : ''}{a.district}, {a.province}
              </p>
              {!a.isDefault && (
                <button
                  type="button"
                  onClick={() => handleSetDefault(a.id)}
                  className="mt-3 text-xs font-medium text-brand underline underline-offset-2"
                >
                  Set as default
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit address' : 'Add address'}</DialogTitle>
            <DialogDescription>Save this address to reuse it at checkout.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Label</Label>
              <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Home, Office, Family..." className="mt-1.5" />
            </div>
            <div>
              <Label>Recipient name</Label>
              <Input value={form.recipientName} onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Province</Label>
              <Input value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>District</Label>
              <Input value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Commune (optional)</Label>
              <Input value={form.commune} onChange={(e) => setForm((f) => ({ ...f, commune: e.target.value }))} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label>Street address</Label>
              <Input value={form.streetAddress} onChange={(e) => setForm((f) => ({ ...f, streetAddress: e.target.value }))} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label>Delivery note (optional)</Label>
              <Textarea value={form.deliveryNote} onChange={(e) => setForm((f) => ({ ...f, deliveryNote: e.target.value }))} rows={2} className="mt-1.5" />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? 'Save changes' : 'Save address'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
