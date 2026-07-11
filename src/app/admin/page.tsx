import type { Metadata } from 'next'
import { DashboardClient } from '@/components/admin/dashboard-client'
import { DashboardSummaryCards } from '@/components/admin/dashboard-summary-cards'

export const metadata: Metadata = {
  title: 'Dashboard · Admin',
  description: 'The Scent Lab admin dashboard — revenue, orders, customers and top products at a glance.',
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back — here&apos;s how The Scent Lab is performing.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Today at a glance
        </p>
        <DashboardSummaryCards />
      </div>

      <DashboardClient />
    </div>
  )
}
