import type { Metadata } from 'next'
import { OrdersClient } from './orders-client'

export const metadata: Metadata = {
  title: 'Orders · Admin',
  description: 'View and manage customer orders at The Scent Lab.',
}

export default function AdminOrdersPage() {
  return <OrdersClient />
}
