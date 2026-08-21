# The Scent Lab
## An Online Fragrance Marketplace for the Cambodian Market

**A Senior Project Report / Defense Presentation Document**

---

**Presented by:** [Student Name]
**Student ID:** [Student ID]
**Supervisor:** [Supervisor Name]
**Department:** [Department Name]
**University:** [University Name]
**Academic Year:** [Academic Year]
**Date of Defense:** [Date]

*Note: This document is prepared for presentation and academic defense purposes. Internal system credentials, infrastructure identifiers, and deployment secrets have been intentionally omitted and are documented separately in project handover materials.*

---

## Content

1. Introduction
2. Literature Review
3. Methodology
4. Results / Demo
5. Discussion
6. Conclusion
7. Future Work

---

# 1. Introduction

## Background and Motivation

- Fragrance (perfume and eau de parfum) consumption in Cambodia has grown steadily alongside rising disposable income and increasing exposure to international beauty and lifestyle trends.
- Despite this growth, most fragrance purchasing in Cambodia still happens through **informal, unstructured channels** — physical retail counters, or social-media-based selling on Facebook Pages, Instagram, and Telegram.
- These informal channels lack the structure, trust signals, and convenience that modern online shoppers expect: searchable catalogs, transparent pricing, secure checkout, and order tracking.
- Regional and international fragrance e-commerce platforms exist, but none are purpose-built for the Cambodian market — they do not support local payment methods, local currency-first pricing, or Cambodia-focused logistics.
- **The Scent Lab** was conceived to fill this gap: a dedicated, modern, full-featured online fragrance marketplace built specifically with the local market's needs in mind, while following international e-commerce UX standards.

## Problem Statement

Customers currently face several recurring problems when buying perfume online in Cambodia:

- **No centralized catalog** — products are scattered across individual sellers' social media pages with inconsistent information and no reliable search.
- **Manual, slow ordering process** — orders are typically placed via direct message, requiring back-and-forth confirmation instead of an automated checkout flow.
- **Limited payment transparency** — pricing, stock availability, and order status are rarely visible in real time.
- **No structured order history** — customers cannot easily track past purchases, reorder favorites, or manage addresses.
- **Inconsistent trust and legitimacy signals** — no standardized brand pages, verified product information, or professional storefront presentation.
- **No unified local payment integration** — most informal sellers rely purely on manual bank transfer confirmation, with no automated, real-time QR-based payment verification.

## Aim and Objectives

The aim of this project is to design and develop a modern, full-stack e-commerce platform dedicated to fragrance retail, tailored to the Cambodian market.

Specific objectives:

- Build a modern, responsive perfume marketplace accessible via web browser.
- Implement structured **product catalog management** (products, brands, categories, collections).
- Implement a secure **authentication system** for both customers and staff.
- Implement a persistent **shopping cart** experience.
- Implement a complete **checkout process**, including address management and local payment options.
- Implement **order management** — for customers (order history, tracking) and staff (fulfillment, shipment).
- Implement a full-featured **admin dashboard** for catalog, inventory, order, customer, and staff management.
- Ensure a **mobile-responsive design** across the entire platform.

## Scope and Limitations

**In Scope:**

- Customer-facing storefront website (browsing, search, cart, checkout, account management)
- Admin dashboard (catalog, inventory, orders, payments, shipments, customers, staff, analytics)
- Product, brand, category, and collection management
- Authentication and role-based access control
- Shopping cart with persistent state
- Order lifecycle management (placement through delivery)
- Fully responsive UI for desktop, tablet, and mobile browsers

**Limitations:**

- No dedicated native mobile application (iOS/Android) in this phase — the platform is delivered as a responsive web application.
- The platform is scoped and localized for the **Cambodian market** (currency, payment methods, delivery workflow) rather than designed for multi-region deployment.
- Payment integration is currently limited to a defined set of methods appropriate to the local market (Cash on Delivery and local QR-based mobile payment), rather than a broad set of international payment gateways.

---

# 2. Literature Review

To position The Scent Lab within the existing e-commerce landscape, five categories of existing platforms were reviewed: a fragrance reference/community site, a global multi-brand beauty retailer, a European fragrance e-commerce platform, a niche international fragrance boutique, and typical local Cambodian informal sellers.

## Fragrantica

- **Description:** A large online fragrance encyclopedia and community platform, primarily focused on fragrance information, notes, and user reviews rather than direct retail.
- **Key Features:** Extensive fragrance database, detailed scent-note breakdowns, community ratings and reviews, "similar fragrance" discovery.
- **Weaknesses:** Not a true storefront — no integrated cart or checkout of its own; purchasing typically redirects to third-party retailers; not localized for Southeast Asian markets.
- **Lessons Learned:** The value of detailed product information (notes, longevity, projection, sillage) and community-style reviews as trust signals — both were adopted as first-class product attributes in The Scent Lab's data model.

## Sephora

- **Description:** A global, multi-brand beauty and fragrance retailer with a mature e-commerce platform.
- **Key Features:** Large catalog across many beauty categories, loyalty/rewards program, polished product detail pages, strong filtering and search.
- **Weaknesses:** Very broad catalog (not fragrance-specialized), no dedicated presence or localized payment/delivery for the Cambodian market.
- **Lessons Learned:** The importance of clean filtering (by brand, category, price), a polished product detail layout, and a frictionless cart-to-checkout flow — directly informed The Scent Lab's product listing and checkout UX.

## Notino

- **Description:** A European online beauty and fragrance retailer with a large fragrance-specific catalog and multi-country shipping.
- **Key Features:** Deep fragrance catalog, frequent promotions, gift-set bundling, multi-language support.
- **Weaknesses:** Not localized for Cambodia — no local currency-first pricing, no local payment methods, shipping not oriented toward the local market.
- **Lessons Learned:** The value of promotional/sale sections and clear price-comparison (compare-at pricing) to communicate value to price-sensitive shoppers.

## LuckyScent

- **Description:** A U.S.-based niche and indie fragrance boutique, known for a curated rather than exhaustive catalog.
- **Key Features:** Curated brand selection, strong editorial/storytelling content per brand and fragrance, sample-based discovery model.
- **Weaknesses:** U.S.-centric shipping and pricing; curated catalog size limits product breadth; no relevance to local market payment/delivery norms.
- **Lessons Learned:** The value of brand storytelling ("the house" narrative) and curation over sheer catalog size — reflected in The Scent Lab's dedicated brand pages.

## Local Cambodian E-Commerce Perfume Sellers

- **Description:** Informal sellers operating primarily through Facebook Pages, Instagram, and Telegram/Messenger-based ordering.
- **Key Features:** Low barrier to entry, direct personal communication with buyers, flexible/negotiable pricing.
- **Weaknesses:** No structured catalog or search, manual and slow order confirmation, no automated payment verification, no order tracking or history, inconsistent product/stock information, limited buyer trust.
- **Lessons Learned:** The clearest gap in the local market — the complete absence of a structured, automated, trustworthy storefront experience. This is the primary problem The Scent Lab directly addresses.

## Comparison Table

| Platform | Fragrance-Focused | Structured Catalog | Cart / Checkout | Local (Cambodia) Payment | Order Tracking | Localized for Cambodia |
|---|---|---|---|---|---|---|
| Fragrantica | Yes | Reference only | No | No | No | No |
| Sephora | No (broad beauty) | Yes | Yes | No | Yes | No |
| Notino | Yes | Yes | Yes | No | Yes | No |
| LuckyScent | Yes (niche) | Yes (curated) | Yes | No | Yes | No |
| Local Cambodia sellers | Yes | No | No (manual) | Manual only | No | Yes (informally) |
| **The Scent Lab** | **Yes** | **Yes** | **Yes** | **Yes (QR-based / COD)** | **Yes** | **Yes** |

---

# 3. Methodology

## Technology Stack

**Frontend**

- Next.js (React framework, App Router)
- React
- TypeScript
- Tailwind CSS
- Component library built on Radix UI primitives for accessible, consistent UI elements
- Zustand for lightweight client-side state management (cart, wishlist)

**Backend**

- Next.js API Routes (server-side application logic)
- Prisma ORM (type-safe database access layer)
- Supabase (managed PostgreSQL database hosting)

**Authentication & Security**

- Custom authentication service using industry-standard **bcrypt** password hashing
- Secure, **httpOnly session-cookie**-based session management
- Role-based access control (RBAC) restricting administrative functionality by user role

**Hosting & Infrastructure**

- Vercel (application hosting and continuous deployment)
- Cloudinary (image/media hosting and optimization)

**Additional Integrations**

- Firebase Cloud Messaging (browser push notifications for order updates)
- Local QR-based mobile payment standard (KHQR) and Cash on Delivery

**Version Control**

- GitHub (source control and collaboration)

## System Architecture

The system follows a modern three-tier web application architecture:

```
┌─────────────────────────────────────────────┐
│                CLIENT LAYER                  │
│  Browser — Next.js / React UI                │
│  Responsive storefront + Admin dashboard      │
└───────────────────┬───────────────────────────┘
                     │  HTTPS
┌───────────────────▼───────────────────────────┐
│              APPLICATION LAYER                │
│  Next.js API Routes                            │
│  - Business logic (catalog, cart, checkout,    │
│    orders, payments, inventory)                │
│  - Authentication & session management         │
│  - Role-based access control                   │
└───────────────────┬───────────────────────────┘
                     │  Prisma ORM
┌───────────────────▼───────────────────────────┐
│                 DATA LAYER                     │
│  PostgreSQL Database (managed hosting)         │
└─────────────────────────────────────────────────┘

      External Services (integrated at the
      Application Layer, credentials secured
      server-side only):
      - Media/image hosting
      - Push notification delivery
      - Local QR payment gateway
```

- The **client layer** renders the storefront and admin dashboard, communicating with the server exclusively over authenticated HTTPS requests.
- The **application layer** hosts all business logic, authentication, and authorization — no sensitive data or credentials are ever exposed to the browser.
- The **data layer** persists all catalog, order, user, and operational data in a managed relational database.
- All infrastructure credentials, connection details, and service keys are stored securely as server-side environment configuration and are never exposed to the client or included in this document.

## Database Design

The data model is built around the following core entities:

- **Users** — customer and staff accounts, including role assignment (e.g., Customer, Admin), profile information, and authentication credentials (securely hashed).
- **Products** — the fragrance catalog: name, description, pricing, volume/size variants, fragrance notes, and stock levels.
- **Categories** — merchandising groupings used to organize products for browsing (e.g., Men's Fragrances, Women's Fragrances).
- **Brands** — the fragrance houses/brands carried on the platform, each with its own profile page.
- **Orders** — a customer's placed order, including status (e.g., pending payment, preparing, shipped, delivered) and totals.
- **Order Items** — individual product line items belonging to an order (product, quantity, price at time of purchase).
- **Reviews** — customer-submitted ratings and feedback on purchased products.

**Conceptual Entity Relationships:**

- A **User** can place many **Orders**.
- An **Order** contains many **Order Items**, each referencing one **Product**.
- A **Product** belongs to one **Brand** and can belong to one or more **Categories**.
- A **User** can submit many **Reviews**, and a **Product** can receive many **Reviews**.

*(Additional supporting entities — such as Payments, Shipments, Addresses, and Wishlist — extend this core model to support the full order lifecycle and are covered at a functional level in the Results/Demo section rather than at the schema level here.)*

## Use Cases

**Customer Use Case**

- Register a new account
- Log in / log out securely
- Browse the product catalog
- Search for products
- Add products to cart
- Complete checkout (address + payment selection)
- View order history and order status
- Manage account profile and saved addresses

**Admin / Staff Use Case**

- Log in to the administrative dashboard
- Manage products (create, edit, remove, adjust stock)
- Manage categories
- Manage brands
- Manage and fulfill customer orders
- Manage user accounts and staff roles
- View sales, order, and inventory analytics

---

# 4. Results / Demo

*The following sections correspond to live application screenshots to be inserted during the presentation.*

## Homepage

`[Insert Screenshot: Homepage]`

- **Purpose:** First impression of the brand; entry point into the catalog.
- **Key Features:**
  - Hero section introducing the platform
  - "Shop by category" section with category cards
  - Featured / new-arrival product highlights
  - Fully responsive layout across desktop and mobile

## Product Listing

`[Insert Screenshot: Product Listing Page]`

- **Purpose:** Allow customers to browse and narrow down the full catalog.
- **Key Features:**
  - Filtering by brand, category, collection, gender, and price range
  - Sorting options
  - Pagination for large result sets
  - Responsive grid layout

## Product Detail

`[Insert Screenshot: Product Detail Page]`

- **Purpose:** Present complete information for a single fragrance to support a purchase decision.
- **Key Features:**
  - Product imagery and volume/size selector with pricing per size
  - Fragrance notes (top / heart / base), longevity, projection, and sillage indicators
  - Customer reviews and ratings
  - Related product recommendations

## Shopping Cart

`[Insert Screenshot: Shopping Cart]`

- **Purpose:** Let customers review and adjust selected items before checkout.
- **Key Features:**
  - Persistent cart that survives page reloads
  - Quantity adjustment and item removal
  - Running subtotal calculation

## Checkout

`[Insert Screenshot: Checkout Flow]`

- **Purpose:** Convert cart contents into a confirmed order.
- **Key Features:**
  - Delivery address selection/entry
  - Payment method selection (local QR-based payment or Cash on Delivery)
  - Order summary and confirmation

## User Profile

`[Insert Screenshot: Account / Profile Page]`

- **Purpose:** Give customers self-service control over their account.
- **Key Features:**
  - Order history and order status tracking
  - Saved addresses
  - Profile details and avatar management
  - Notification preferences

## Admin Dashboard

`[Insert Screenshot: Admin Dashboard Overview]`

- **Purpose:** Give administrators a real-time operational overview of the store.
- **Key Features:**
  - Recent orders and recently added products
  - Key sales and order metrics at a glance
  - Quick navigation to all management modules

## Product Management

`[Insert Screenshot: Admin Product Management]`

- **Purpose:** Allow staff to maintain the product catalog without developer involvement.
- **Key Features:**
  - Full create / edit / delete workflow for products
  - Brand, category, and collection assignment
  - Stock and pricing management per product variant

---

# 5. Discussion

## Key Findings

**Successful Implementation**

- All core objectives — catalog management, authentication, cart, checkout, order management, and an admin dashboard — were successfully implemented and function end-to-end.
- The platform was validated through direct functional testing of the complete customer journey (browse → cart → checkout → order) and the complete administrative workflow (product creation through order fulfillment).

**User Experience Improvements**

- Compared to the informal, message-based purchasing common in the local market, The Scent Lab provides a structured, self-service experience: searchable catalog, transparent pricing, real-time cart, and automated checkout.
- Order history and status tracking give customers visibility that is largely absent from informal sellers.

**Responsive Design**

- The interface was built mobile-first and verified across desktop, tablet, and mobile breakpoints, ensuring accessibility for the large share of Cambodian consumers who shop primarily via mobile devices.

**Product Management Efficiency**

- The admin dashboard allows non-technical staff to manage the entire catalog (products, brands, categories, collections) and order lifecycle without any code changes or developer involvement, directly addressing the operational gap seen in informal social-media-based selling.

**Scalability**

- Built on a managed, relational database and a modern serverless hosting platform, the architecture supports horizontal scaling of both traffic and catalog size without infrastructure re-engineering.
- A modular service-oriented backend structure (separating catalog, order, payment, and notification concerns) allows individual areas of functionality to be extended independently.

---

# 6. Conclusion

- The Scent Lab successfully delivers a complete, modern e-commerce platform purpose-built for online fragrance retail in the Cambodian market.
- The project addresses a clearly identified market gap: the absence of a structured, trustworthy, self-service fragrance shopping experience, as revealed by both the problem statement and the comparative literature review.
- All defined objectives were achieved: a responsive customer storefront, a complete shopping and checkout flow, order management, and a full administrative dashboard.
- The platform demonstrates that a locally-focused, well-engineered e-commerce solution can meaningfully improve on the informal channels currently dominating the local fragrance market, while matching UX standards set by established international platforms.

---

# 7. Future Work

- **Mobile application** — a dedicated native or cross-platform mobile app to complement the responsive web experience.
- **AI-powered fragrance recommendation** — personalized suggestions based on browsing history, purchase history, and stated scent preferences.
- **Wishlist enhancements** — expanded wishlist sharing and notification features.
- **Advanced search filters** — note-based search, scent-profile filtering, and improved discovery tools.
- **Multi-language support** — Khmer-language localization alongside English.
- **Additional payment integrations** — expanding beyond the current local payment methods to additional local and regional gateways.
- **Expanded customer reviews and ratings** — richer review features such as verified-purchase badges and photo reviews.

---

# Thank You

**Thank you for your attention.**

## Questions & Discussion

*[Student Name] — [Contact Email Placeholder]*
*[University Name] — [Department Name]*
