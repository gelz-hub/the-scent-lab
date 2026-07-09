'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Mail, Check, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export function NewsletterSection() {
  const [email, setEmail] = React.useState('')
  const [done, setDone] = React.useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email')
      return
    }
    setDone(true)
    toast.success('Welcome to The Scent Lab', {
      description: 'Check your inbox for 10% off your first order.',
    })
    setEmail('')
    setTimeout(() => setDone(false), 3000)
  }

  return (
    <section className="relative overflow-hidden bg-surface/40 py-20 sm:py-28">
      {/* Subtle brand-tint background */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand/[0.03] to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Icon cluster */}
          <div className="mx-auto flex items-center justify-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-foreground text-background shadow-sm">
              <Mail className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
              <Sparkles className="h-5 w-5" strokeWidth={1.5} />
            </span>
          </div>

          <h2 className="mt-6 font-display text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
            Join the list
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Be first to discover new arrivals, exclusive edits and members-only
            offers. Enjoy 10% off your first order.
          </p>

          <form
            onSubmit={submit}
            className="mx-auto mt-8 flex max-w-md flex-col gap-2.5 sm:flex-row"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="h-13 flex-1 rounded-xl border border-border bg-background px-5 text-sm shadow-sm outline-none transition-all duration-200 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <button
              type="submit"
              className="flex h-13 items-center justify-center gap-2 rounded-xl bg-foreground px-7 text-sm font-medium text-background shadow-sm transition-all duration-300 hover:bg-brand hover:text-brand-foreground hover:shadow-md hover:shadow-brand/20"
            >
              {done ? (
                <>
                  <Check className="h-4 w-4" strokeWidth={2} /> Subscribed
                </>
              ) : (
                'Subscribe'
              )}
            </button>
          </form>
          <p className="mt-3 text-[11px] text-muted-foreground">
            By subscribing you agree to our Privacy Policy. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
