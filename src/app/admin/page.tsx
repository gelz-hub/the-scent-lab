import type { Metadata } from 'next'
import { DashboardClient } from '@/components/admin/dashboard-client'

export const metadata: Metadata = {
  title: 'Dashboard · Admin',
  description: 'The Scent Lab admin dashboard — revenue, orders, customers and top products at a glance.',
}

export default function AdminDashboardPage() {
  return <DashboardClient />
}
