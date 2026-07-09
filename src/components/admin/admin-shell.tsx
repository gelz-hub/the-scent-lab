'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Boxes,
  BarChart3,
  Bell,
  Truck,
  CreditCard,
  Tags,
  Settings,
  ShieldCheck,
  ScrollText,
  ArrowLeft,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/site/theme-toggle'
import { hasPermission, type Module } from '@/lib/rbac/permissions'
import { GlobalSearchBar } from './global-search-bar'

function initialsFor(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'A'
  )
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  /** Frontend visibility only — the server enforces the real permission on every page/API this links to. Omit for items every admin-area role should see (dashboard, analytics). */
  module?: Module
}

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package, module: 'products' },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart, module: 'orders' },
  { label: 'Shipments', href: '/admin/shipments', icon: Truck, module: 'shipments' },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard, module: 'payments' },
  { label: 'Customers', href: '/admin/customers', icon: Users, module: 'customers' },
  { label: 'Inventory', href: '/admin/inventory', icon: Boxes, module: 'inventory' },
  { label: 'Catalog', href: '/admin/catalog', icon: Tags, module: 'catalog' },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, module: 'analytics' },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell, module: 'notifications' },
  { label: 'Staff', href: '/admin/staff', icon: ShieldCheck, module: 'staff' },
  { label: 'Audit Log', href: '/admin/audit-log', icon: ScrollText, module: 'auditLog' },
  { label: 'Settings', href: '/admin/settings', icon: Settings, module: 'settings' },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  if (href === '#') return false
  return pathname === href || pathname.startsWith(href + '/')
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role

  // Frontend-only filtering — hides links the signed-in role can't use, per
  // spec ("frontend visibility alone is not sufficient" cuts the other way
  // too: every one of these hrefs is independently enforced server-side by
  // requirePermission, so hiding a link here is purely a UX nicety, never
  // the actual gate.
  const visibleNav = NAV.filter((item) => !item.module || !role || hasPermission(role, item.module, 'read'))

  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="Admin navigation">
      {visibleNav.map((item) => {
        const active = isActive(pathname, item.href)
        const Icon = item.icon
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
  const router = useRouter()
  const { data: session } = useSession()

  const displayName = session?.user?.name || session?.user?.email || 'Admin'
  const role = session?.user?.role

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/login')
    router.refresh()
  }

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
        <div className="hidden h-14 items-center justify-between gap-6 border-b border-border bg-background/85 px-8 backdrop-blur md:flex">
          <GlobalSearchBar />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
                {initialsFor(displayName)}
              </div>
              <div className="min-w-0 max-w-[140px]">
                <p className="truncate text-sm font-medium leading-none">{displayName}</p>
                {role && (
                  <p className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                    {role.toLowerCase()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
