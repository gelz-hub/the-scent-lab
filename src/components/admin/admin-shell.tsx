'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Boxes,
  BarChart3,
  Settings,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/site/theme-toggle'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Customers', href: '/admin/users', icon: Users },
  { label: 'Inventory', href: '/admin/inventory', icon: Boxes },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', href: '#', icon: Settings },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  if (href === '#') return false
  return pathname === href || pathname.startsWith(href + '/')
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="Admin navigation">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href)
        const Icon = item.icon
        const isSettings = item.href === '#'
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-surface text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface/60'
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
            <span>{item.label}</span>
            {isSettings && (
              <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground/60">
                Soon
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarHeader() {
  return (
    <div className="border-b border-border px-5 py-5">
      <Link href="/admin" className="block">
        <div className="font-display text-lg font-medium leading-none tracking-tight">
          The Scent Lab
        </div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Admin Console
        </div>
      </Link>
    </div>
  )
}

function BackToStore({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="border-t border-border px-3 py-4">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface/60 hover:text-foreground"
      >
        <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.5} />
        <span>Back to store</span>
      </Link>
    </div>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const pathname = usePathname()

  // Close mobile drawer on route change
  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Lock body scroll when drawer open
  React.useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [mobileOpen])

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <SidebarHeader />
        <div className="flex-1 overflow-y-auto py-4">
          <NavLinks />
        </div>
        <BackToStore />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[82%] max-w-xs flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Link href="/admin" onClick={() => setMobileOpen(false)}>
                <div className="font-display text-lg font-medium leading-none tracking-tight">
                  The Scent Lab
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Admin Console
                </div>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-background"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
            <BackToStore onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <Link href="/admin" className="font-display text-base font-medium tracking-tight">
            The Scent Lab <span className="text-muted-foreground">· Admin</span>
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Desktop top bar */}
        <div className="hidden h-14 items-center justify-between border-b border-border bg-background/85 px-8 backdrop-blur md:flex">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Admin Console
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
              AD
            </div>
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
