import type { Metadata } from 'next'
import { ProductsClient } from './products-client'

export const metadata: Metadata = {
  title: 'Products · Admin',
  description: 'Manage The Scent Lab product catalog — pricing, stock and categories.',
}

export default function AdminProductsPage() {
  return <ProductsClient />
}
