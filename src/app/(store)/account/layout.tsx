'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from '@/components/providers/session-provider'
import {
  LayoutDashboard,
  Package,
  Heart,
  MapPin,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function initialsFor(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'
}

const NAV = [
  { label: 'Overview', href: '/account', icon: LayoutDashboard },
  { label: 'Orders', href: '/account/orders', icon: Package },
  { label: 'Wishlist', href: '/account/wishlist', icon: Heart },
  { label: 'Addresses', href: '/account/addresses', icon: MapPin },
  { label: 'Notifications', href: '/account/notifications', icon: Bell },
  { label: 'Settings', href: '/account/settings', icon: Settings },
] as const

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  const displayName = session?.user?.name || 'Guest User'
  const displayEmail = session?.user?.email || ''

  const isActive = (href: string) =>
    href === '/account' ? pathname === '/account' : pathname.startsWith(href)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    toast.success('Signed out', {
      description: 'You have been signed out of your account.',
    })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Account' }]} />

      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
          My account
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">
          {displayName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your orders, wishlist, addresses and preferences.
        </p>
      </div>

      {/* Mobile nav (horizontal scroll) */}
      <nav
        aria-label="Account sections"
        className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:hidden"
      >
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors',
                active
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            {/* User card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-brand text-brand-foreground text-sm font-medium">
                    {initialsFor(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {displayEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav aria-label="Account sections" className="space-y-1">
              {NAV.map(({ label, href, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors',
                      active
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:bg-surface hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                    {label}
                  </Link>
                )
              })}
            </nav>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Mobile sign-out (visible only on small screens) */}
        <div className="mb-2 sm:hidden">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            Sign out
          </button>
        </div>

        {/* Page content */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
