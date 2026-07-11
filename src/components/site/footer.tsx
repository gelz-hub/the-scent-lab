'use client'

import * as React from 'react'
import Link from 'next/link'
import { Instagram, Twitter, Facebook, Youtube, Check } from 'lucide-react'
import { toast } from 'sonner'

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { label: 'Women', href: '/women' },
      { label: 'Men', href: '/men' },
      { label: 'Unisex', href: '/unisex' },
      { label: 'New Arrivals', href: '/new-arrivals' },
      { label: 'Best Sellers', href: '/best-sellers' },
      { label: 'Sale', href: '/sale' },
    ],
  },
  {
    title: 'Discover',
    links: [
      { label: 'Brands', href: '/brands' },
      { label: 'Gift Sets', href: '/collections/gift' },
      { label: 'Collections', href: '/collections' },
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Track Order', href: '/account/orders' },
      { label: 'Shipping', href: '/shipping' },
      { label: 'Returns', href: '/returns' },
      { label: 'FAQ', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
]

function FooterNewsletter() {
  const [email, setEmail] = React.useState('')
  const [done, setDone] = React.useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email')
      return
    }
    setDone(true)
    toast.success('Subscribed', { description: 'Check your inbox for 10% off.' })
    setEmail('')
    setTimeout(() => setDone(false), 3000)
  }

  return (
    <form onSubmit={submit} className="mt-5 flex max-w-xs gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        aria-label="Email address"
        className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-foreground"
      />
      <button
        type="submit"
        aria-label="Subscribe to newsletter"
        className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-brand hover:text-brand-foreground"
      >
        {done ? <Check className="h-4 w-4" strokeWidth={2} /> : 'Join'}
      </button>
    </form>
  )
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="font-display text-2xl">
              The Scent Lab
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A curated marketplace of authentic fragrances from the world's finest
              houses. Curated Fragrances. Authentic Brands.
            </p>
            <FooterNewsletter />
            <div className="mt-5 flex gap-2">
              {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} The Scent Lab. All fragrances are trademarks of their respective owners.
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Secure payments</span>
            <span className="h-3 w-px bg-border" />
            <span>Authenticity guaranteed</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
