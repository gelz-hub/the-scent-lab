'use client'

import * as React from 'react'
import { Mail, MapPin, Phone, Send, Check } from 'lucide-react'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { toast } from 'sonner'

export default function ContactPage() {
  const [sent, setSent] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
    toast.success('Message sent', { description: "We'll reply within 24 hours." })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
      <div className="mb-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">We're here to help</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">Contact us</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Questions about an order, a fragrance, or a recommendation? Our team
          replies within 24 hours, Monday to Friday.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-xl border border-border p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">First name *</label>
              <input required className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Last name *</label>
              <input required className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email *</label>
              <input type="email" required className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Subject</label>
              <input className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Message *</label>
              <textarea required rows={5} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground" />
            </div>
          </div>
          <button
            type="submit"
            className="mt-5 flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
          >
            {sent ? <><Check className="h-4 w-4" /> Sent</> : <><Send className="h-4 w-4" /> Send message</>}
          </button>
        </form>

        {/* Info */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-border p-6">
            <h2 className="font-display text-lg font-medium">Reach us</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 text-brand" strokeWidth={1.5} />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p>hello@thescentlab.com</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 text-brand" strokeWidth={1.5} />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p>+1 (212) 555-0100</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 text-brand" strokeWidth={1.5} />
                <div>
                  <p className="text-xs text-muted-foreground">Studio</p>
                  <p>120 Greene Street<br />New York, NY 10012</p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface/50 p-6">
            <h3 className="text-sm font-semibold">Customer care hours</h3>
            <p className="mt-2 text-sm text-muted-foreground">Monday – Friday<br />9am – 6pm EST</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
