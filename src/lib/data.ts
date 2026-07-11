// Shared catalog type definitions + still-static journal content.
//
// Catalog data itself (products/brands/categories/collections) now comes
// from the database via src/lib/catalog.ts — see that file for the
// Prisma-backed replacements of what used to live here as static arrays.
// These interfaces are kept here because catalog.ts and many storefront
// components still import them for typing.
//
// Journal/Discover articles remain static pending their own CMS phase
// (no JournalArticle schema model exists yet).

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

export interface JournalPost {
  id: string
  title: string
  excerpt: string
  category: string
  date: string
  readTime: string
  image: string
}

export interface JournalArticle extends JournalPost {
  slug: string
  body: string[]
  author: string
}

export const journal: JournalPost[] = [
  {
    id: "j1",
    title: "How to Find Your Signature Scent",
    excerpt:
      "A calm, practical guide to building a fragrance wardrobe that truly feels like you — from first spritz to skin chemistry.",
    category: "Guide",
    date: "Nov 18, 2024",
    readTime: "6 min read",
    image: "/images/journal-1.png",
  },
  {
    id: "j2",
    title: "Inside the Perfumer's Atelier",
    excerpt:
      "We step inside a working perfumer's lab to understand how a single accord becomes a finished flacon.",
    category: "Stories",
    date: "Nov 04, 2024",
    readTime: "8 min read",
    image: "/images/journal-2.png",
  },
  {
    id: "j3",
    title: "Understanding Fragrance Notes",
    excerpt:
      "Top, heart and base — what each layer means and why your scent transforms throughout the day.",
    category: "Guide",
    date: "Oct 22, 2024",
    readTime: "5 min read",
    image: "/images/journal-1.png",
  },
  {
    id: "j4",
    title: "How to Store Your Perfume",
    excerpt:
      "Light, heat and humidity are the enemies of fine fragrance. Here's how to make every bottle last.",
    category: "Guide",
    date: "Oct 08, 2024",
    readTime: "4 min read",
    image: "/images/journal-2.png",
  },
  {
    id: "j5",
    title: "The Art of Layering Fragrance",
    excerpt:
      "Why wear one scent when you can compose your own? A primer on combining fragrances with confidence.",
    category: "Guide",
    date: "Sep 24, 2024",
    readTime: "7 min read",
    image: "/images/journal-1.png",
  },
  {
    id: "j6",
    title: "A Brief History of Niche Perfumery",
    excerpt:
      "From Grasse to Brooklyn — how a handful of independent houses reshaped the way we think about scent.",
    category: "Stories",
    date: "Sep 10, 2024",
    readTime: "9 min read",
    image: "/images/journal-2.png",
  },
]

export const journalArticles: JournalArticle[] = [
  {
    ...journal[0],
    slug: "how-to-find-your-signature-scent",
    author: "The Scent Lab Editors",
    body: [
      "Finding a signature scent is less about following trends and more about listening to yourself. The right fragrance should feel like an extension of your personality — something you reach for without thinking.",
      "Start by identifying the families you're drawn to. Do you gravitate toward fresh citrus, warm amber, green florals or smoky woods? Visit a fragrance counter or order a discovery set and wear each scent for a full day.",
      "Pay attention to how the fragrance evolves. Top notes fade within minutes; the heart and base are what you'll live with for hours. Skin chemistry matters enormously — a scent that sings on a friend may fall flat on you, and vice versa.",
      "Build a small wardrobe rather than hunting for a single perfect perfume. A daytime fresh scent, an evening warm scent and a signature for special occasions will serve you better than one bottle you tire of.",
      "Above all, trust your nose. There are no wrong answers in perfumery — only scents that feel like you, and scents that don't.",
    ],
  },
  {
    ...journal[1],
    slug: "inside-the-perfumers-atelier",
    author: "Léa Dubois",
    body: [
      "Behind every bottle of fine fragrance is a perfumer — a nose — who spent months or years composing the accord inside. We visited a working atelier to understand the craft.",
      "The perfumer's organ, as the workspace is traditionally called, is a semicircle of hundreds of raw materials: natural absolutes, synthetics, tinctures and resins, each in its own labelled flask.",
      "A composition begins with a brief. The house may ask for a fragrance that evokes a Mediterranean garden, or a modern reinterpretation of a classic chypre. The perfumer sketches the structure first — the base, then the heart, then the top.",
      "Each trial is evaluated on blotting strips and on skin, then revisited days later as the dry-down reveals itself. A single fragrance may go through hundreds of modifications before it's deemed finished.",
      "What emerges is part science, part art — a composition designed to unfold over hours, telling a story on the skin of whoever wears it.",
    ],
  },
  {
    ...journal[2],
    slug: "understanding-fragrance-notes",
    author: "The Scent Lab Editors",
    body: [
      "Every fragrance is built in three layers: top, heart and base. Understanding this pyramid is the key to appreciating how a scent develops on your skin.",
      "Top notes are what you smell the moment you spray. They're typically light, volatile molecules — citrus, herbs, light fruits — that evaporate within the first 15 to 30 minutes.",
      "Heart notes emerge as the tops fade, forming the character of the fragrance. Florals, spices and green notes commonly live here, and they define what most people will remember about the scent.",
      "Base notes are the foundation — rich, heavy molecules like woods, musk, amber and vanilla that anchor the composition and linger for hours, sometimes days, on clothing.",
      "This is why a fragrance smells different in the morning than it does at lunchtime, and why you should always test a scent on your skin and wait before deciding.",
    ],
  },
  {
    ...journal[3],
    slug: "how-to-store-your-perfume",
    author: "Marcus Hale",
    body: [
      "Fine fragrance is delicate. A bottle kept carelessly can turn in a matter of months, losing its brightness and taking on a sour, metallic edge.",
      "The three enemies are light, heat and air. Ultraviolet light breaks down the aromatic molecules, which is why quality flacons are opaque or deeply tinted. Store your bottles in a closed cabinet or their original box.",
      "Heat accelerates oxidation. Avoid windowsills, radiators and bathrooms, where steam and temperature swings are constant. A cool, dark drawer is ideal.",
      "Once opened, a bottle begins a slow decline. Most fragrances stay true for three to five years; citrus and green scents turn fastest, while heavy ambers and woods age gracefully.",
      "Decanting into smaller atomizers helps for bottles you use rarely, as it reduces the air inside the flacon. And never shake a bottle — the agitation introduces oxygen and speeds degradation.",
    ],
  },
  {
    ...journal[4],
    slug: "art-of-layering-fragrance",
    author: "Sofia Romano",
    body: [
      "Layering — wearing two or more fragrances at once — is an old perfumery tradition enjoying a modern revival. Done well, it produces a scent that is unmistakably yours.",
      "Begin with a simple base. A clean musk, a light floral or a transparent wood makes an excellent canvas. Apply it first, generously, to pulse points.",
      "Add a second fragrance that contrasts or complements. A bright citrus over a warm amber creates depth; a green tea over a white floral adds freshness without sweetness.",
      "Keep the number of layers to two, occasionally three. More than that and the composition becomes muddy. Avoid combining two heavy, loud fragrances — let one lead and the other support.",
      "The joy of layering is that no two combinations are alike. Experiment, take notes on what works, and over time you'll develop a personal scent vocabulary that no single bottle could provide.",
    ],
  },
  {
    ...journal[5],
    slug: "brief-history-of-niche-perfumery",
    author: "Léa Dubois",
    body: [
      "For most of the twentieth century, perfume was the domain of a handful of grand houses — Chanel, Dior, Guerlain — producing fragrances designed to appeal to millions.",
      "The niche movement began quietly in the 1980s and 90s, when a new generation of perfumers rejected mass appeal in favor of singular, sometimes challenging compositions. Houses like L'Artisan Parfumeur and Serge Lutens led the way.",
      "By the 2000s, brands like Le Labo, Byredo and Maison Francis Kurkdjian had turned niche into a global phenomenon, proving that discerning customers would pay a premium for distinctive, less ubiquitous scents.",
      "What sets niche apart is not price or rarity alone, but intention. Niche houses make fragrances to express a point of view, not to fill a market gap. The result is a body of work that rewards exploration.",
      "Today the line between niche and mainstream has blurred — many niche houses are now owned by larger groups — but the spirit of independent perfumery endures, and the shelves of The Scent Lab are richer for it.",
    ],
  },
]

export const articleBySlug = (slug: string) =>
  journalArticles.find((a) => a.slug === slug)

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
