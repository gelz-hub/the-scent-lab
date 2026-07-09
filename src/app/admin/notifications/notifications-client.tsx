'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Megaphone, PackageCheck, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export function NotificationsClient() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send browser push notifications to customers. Back-in-stock, price-drop and new-arrival
          alerts go out automatically from the Products page — use this for one-off campaigns.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PromotionForm />
        <OrderUpdateForm />
      </div>
    </div>
  )
}

function PromotionForm() {
  const [title, setTitle] = React.useState('')
  const [body, setBody] = React.useState('')
  const [url, setUrl] = React.useState('')
  const [sending, setSending] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message are required')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'promotion', title, body, url: url || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not send notification')
        return
      }
      toast.success('Promotion sent to subscribed customers')
      setTitle('')
      setBody('')
      setUrl('')
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-brand" strokeWidth={1.5} />
          <CardTitle className="font-display text-lg font-medium tracking-tight">Promotion</CardTitle>
        </div>
        <CardDescription>Broadcast to every customer subscribed to promotional alerts.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="promo-title" className="mb-1.5 block text-xs text-muted-foreground">Title</Label>
            <Input id="promo-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summer Sale — 20% off" />
          </div>
          <div>
            <Label htmlFor="promo-body" className="mb-1.5 block text-xs text-muted-foreground">Message</Label>
            <Textarea id="promo-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Save on niche fragrances this week only." />
          </div>
          <div>
            <Label htmlFor="promo-url" className="mb-1.5 block text-xs text-muted-foreground">Link (optional)</Label>
            <Input id="promo-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/sale" />
          </div>
          <Button type="submit" disabled={sending} className="bg-foreground text-background hover:bg-brand hover:text-brand-foreground">
            {sending ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>) : 'Send promotion'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function OrderUpdateForm() {
  const [email, setEmail] = React.useState('')
  const [orderNumber, setOrderNumber] = React.useState('')
  const [status, setStatus] = React.useState('')
  const [sending, setSending] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !orderNumber.trim() || !status.trim()) {
      toast.error('All fields are required')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'order-update', userEmail: email, orderNumber, status }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not send notification')
        return
      }
      toast.success('Order update sent')
      setOrderNumber('')
      setStatus('')
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <PackageCheck className="h-4 w-4 text-brand" strokeWidth={1.5} />
          <CardTitle className="font-display text-lg font-medium tracking-tight">Order update</CardTitle>
        </div>
        <CardDescription>Notify a single customer about their order status.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="order-email" className="mb-1.5 block text-xs text-muted-foreground">Customer email</Label>
            <Input id="order-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@thescentlab.com" />
          </div>
          <div>
            <Label htmlFor="order-number" className="mb-1.5 block text-xs text-muted-foreground">Order number</Label>
            <Input id="order-number" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="#SL-1024" />
          </div>
          <div>
            <Label htmlFor="order-status" className="mb-1.5 block text-xs text-muted-foreground">Status</Label>
            <Input id="order-status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Shipped" />
          </div>
          <Button type="submit" disabled={sending} className="bg-foreground text-background hover:bg-brand hover:text-brand-foreground">
            {sending ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>) : 'Send update'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
