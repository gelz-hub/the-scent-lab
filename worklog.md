# The Scent Lab — Multi-Page Refactor Worklog

---
Task ID: 1-6
Agent: Main (orchestrator)
Task: Refactor single-page site into multi-page e-commerce app (data, store, components, layout, storefront pages)

Work Log:
- Expanded `src/lib/data.ts`: added 6 journal articles with slugs + full body content, 10 collection details (Luxury, Niche, Fresh, Woody, Office, Summer, Winter, Date Night, Gift, Travel) with product-mapping helpers, product FAQs, relatedProducts(), articleBySlug(), Crumb type
- Updated `src/lib/store.ts`: removed quickView/setQuickView, added addRecentlyViewed(id) for product-page tracking
- Built reusable components: Breadcrumb, EmptyState, skeletons (ProductCardSkeleton/ProductGridSkeleton), BrandCard, JournalCard, CategoryCard, Pagination, WishlistButton, AddToCartButton, ProsePage, ProductListing (filter+sort+grid+pagination extracted from shop)
- Refactored Header (Link-based nav with usePathname active states), Footer (Link-based), ProductCard (Link to /product/[slug], brand link to /brands/[slug]), SearchDialog (navigates to /product/[slug] via router.push)
- Deleted obsolete quick-view-dialog.tsx and sections/shop.tsx
- Created route group `src/app/(store)/` with shared layout (Header+Footer+CartSheet+WishlistSheet+SearchDialog)
- Built home page with: Hero, BrandMarquee, CategorySection, New Arrivals, Best Sellers, CollectionSection, Trending, Reviews, Journal, Instagram, Newsletter
- Built storefront pages: /shop, /women, /men, /unisex, /new-arrivals, /best-sellers, /sale, /collections, /collections/[slug], /brands, /brands/[slug], /journal, /journal/[slug], /search, /product/[slug], /cart, /checkout, /about, /contact, /privacy, /terms, /shipping, /returns, /not-found
- Product detail page includes: gallery, brand link, volume selector, qty, add-to-cart, wishlist, fragrance pyramid, performance bars, meta grid, reviews, FAQ accordion, related products, recently-viewed tracking
- Checkout page has 4-step stepper (information/shipping/payment/review) with order summary and confirmation state
- Search page has live search, recent searches (localStorage), popular searches, brand+product results
- Fixed apostrophe parsing errors and lint warnings

Stage Summary:
- All storefront pages built with proper App Router routing (no anchor links remain)
- Design system preserved exactly: Cormorant Garamond + Inter, #2F5D50 accent, flat UI, same spacing/animations
- Reusable ProductListing component powers /shop, /women, /men, /unisex, /new-arrivals, /best-sellers, /sale, /collections/[slug], /brands/[slug]
- generateStaticParams + generateMetadata on all dynamic routes for SEO
- Remaining: account pages (/account/*, /login, /register) and admin pages (/admin/*) — delegated to subagents
