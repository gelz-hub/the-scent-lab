export interface AdminProduct {
  id: string
  slug: string
  sku?: string | null
  status?: 'DRAFT' | 'ACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED'
  createdAt?: string
  updatedAt?: string
  name: string
  brand: string
  brandSlug: string
  gender: string
  category: string
  collection: string[]
  image: string
  gallery: string[]
  volumes: { ml: number; price: number }[]
  compareAtPrice: number | null
  rating: number
  reviewCount: number
  description: string
  story: string
  notes: { top: string[]; heart: string[]; base: string[] }
  longevity: number
  projection: number
  sillage: number
  seasons: string[]
  occasions: string[]
  country: string
  year: number
  tags: string[]
  stock: number
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}
