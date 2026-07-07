'use client'

import { Instagram, Twitter, Facebook, Youtube } from 'lucide-react'

const COLUMNS = [
  {
    title: 'Shop',
    links: ['Women', 'Men', 'Unisex', 'New Arrivals', 'Best Sellers', 'Gift Sets', 'Sale'],
  },
  {
    title: 'Discover',
    links: ['All Brands', 'Collections', 'Journal', 'About Us', 'Sustainability', 'Careers'],
  },
  {
    title: 'Help',
    links: ['Contact', 'Shipping', 'Returns', 'Track Order', 'FAQ', 'Size Guide'],
  },
  {
    title: 'Legal',
    links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Accessibility'],
  },
]

export function Footer() {
  return (
    <footer id="contact" className="mt-auto border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <p className="font-display text-2xl">The Scent Lab</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A curated marketplace of authentic fragrances from the world's finest
              houses. Curated Fragrances. Authentic Brands.
            </p>
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
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l}
                    </a>
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
