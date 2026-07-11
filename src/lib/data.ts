// Shared catalog type definitions.
//
// Catalog data itself (products/brands/categories/collections) now comes
// from the database via src/lib/catalog.ts — see that file for the
// Prisma-backed replacements of what used to live here as static arrays.
// These interfaces are kept here because catalog.ts and many storefront
// components still import them for typing.

export type Gender = "Women" | "Men" | "Unisex"
export type CollectionTag = "Luxury" | "Niche" | "Gift"
export type Season = "Spring" | "Summer" | "Autumn" | "Winter"
export type Occasion =
  | "Daytime"
  | "Evening"
  | "Office"
  | "Date Night"
  | "Special Occasion"
  | "Casual"

export interface VolumeOption {
  ml: number
  price: number
}

export interface ProductNotes {
  top: string[]
  heart: string[]
  base: string[]
}

export interface Review {
  id: string
  author: string
  rating: number
  date: string
  title: string
  body: string
}

export interface Product {
  id: string
  slug: string
  name: string
  brand: string
  brandSlug: string
  gender: Gender
  category: "Perfume" | "Eau de Parfum" | "Eau de Toilette" | "Gift Set" | "Cologne"
  collection: CollectionTag[]
  image: string
  gallery: string[]
  volumes: VolumeOption[]
  compareAtPrice?: number
  rating: number
  reviewCount: number
  description: string
  story: string
  notes: ProductNotes
  longevity: number // 1-5
  projection: number // 1-5
  sillage: number // 1-5
  seasons: Season[]
  occasions: Occasion[]
  country: string
  year: number
  tags: ("New" | "Bestseller" | "Trending" | "Sale" | "Featured")[]
  stock: number
  reviews: Review[]
}

export interface Brand {
  slug: string
  name: string
  country: string
  founded: number
  tagline: string
  description: string
  productCount: number
}

// ---- FAQs for product pages (generic support copy, not catalog data) ----
export const productFAQs = [
  {
    q: "Is this fragrance authentic?",
    a: "Yes. Every fragrance we sell is sourced directly from the brand or an authorized distributor and is 100% authentic, sealed in its original packaging.",
  },
  {
    q: "How long will a bottle last?",
    a: "A 50ml bottle used daily (2–3 sprays) typically lasts 6–9 months. A 100ml bottle lasts about a year. Store it cool and dark to preserve its character.",
  },
  {
    q: "What size should I buy?",
    a: "If you're trying a fragrance for the first time, we recommend the smallest available size. For a confirmed favorite, the largest size offers the best value per millilitre.",
  },
  {
    q: "Can I return an opened bottle?",
    a: "Unopened bottles can be returned within 30 days for a full refund. Due to the nature of fragrance, opened bottles are non-returnable unless faulty.",
  },
  {
    q: "Do you offer samples?",
    a: "Yes — every order includes complimentary samples so you can discover something new. Discovery sets are also available for select houses.",
  },
]

// ---- Breadcrumb type ----
export interface Crumb {
  label: string
  href?: string
}
