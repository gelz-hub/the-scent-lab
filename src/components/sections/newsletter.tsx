'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Mail, Check } from 'lucide-react'
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
    <section className="border-b border-border bg-surface/50 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-foreground text-background">
            <Mail className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <h2 className="mt-5 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Join the list
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Be first to discover new arrivals, exclusive edits and members-only
            offers. Enjoy 10% off your first order.
          </p>

          <form
            onSubmit={submit}
            className="mx-auto mt-7 flex max-w-md flex-col gap-2 sm:flex-row"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="h-12 flex-1 rounded-lg border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-foreground"
            />
            <button
              type="submit"
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
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
