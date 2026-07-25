# ZYLIX — Product Requirements Document (PRD)

**Version:** 1.0
**Status:** Draft for approval — Milestone 1 of 13
**Owner:** Product / Engineering
**Company:** Powered by Durchex D.A.M Company LTD
**Tagline:** Technology Made Simple.

---

## 1. Executive Summary

ZYLIX is a premium, enterprise-grade e-commerce platform specializing in consumer electronics: smartphones, laptops, gaming devices, smartwatches, accessories, home electronics, and kitchen appliances. ZYLIX is designed to deliver a shopping experience on par with Apple Store, Samsung Store, Amazon, Best Buy, Jumia, and Noon — combining luxury visual design, frictionless UX, and enterprise-grade security/scalability — while establishing its own distinct brand identity.

ZYLIX is built as multi-vendor-capable marketplace infrastructure, but **at v1 launch, Durchex D.A.M Company LTD is the sole seller** — the Seller Dashboard and multi-vendor onboarding flow are fully implemented and functional, but dormant (no external sellers approved) until the business decides to open the marketplace. All catalog, orders, and fulfillment at launch run through Durchex D.A.M, governed by the Admin Dashboard.

---

## 2. Vision & Objectives

**Vision:** Make premium technology simple to discover, compare, buy, and own — anywhere in the world.

**Business objectives:**
1. Launch a conversion-optimized storefront that competes with tier-1 electronics retailers.
2. Support multiple sellers, multiple currencies, and multiple languages from day one to enable regional expansion (starting with Africa/Nigeria via Flutterwave & Paystack, and global via Stripe/PayPal).
3. Build trust through transparent order tracking, easy returns, verified reviews, and strong fraud protection.
4. Establish a data-driven operation: analytics, SEO tooling, and CMS so the business team can operate without engineering intervention for content changes.
5. Ship a codebase that is secure, testable, and scalable enough to support enterprise-level traffic (flash sales, seasonal peaks).

**Success metrics (KPIs):**
- Conversion rate (visit → purchase)
- Cart abandonment rate
- Average order value (AOV)
- Customer repeat-purchase rate / reward program engagement
- Page load / Core Web Vitals scores (LCP < 2.5s, CLS < 0.1, INP < 200ms)
- Seller onboarding time and seller satisfaction
- Support resolution time (live chat / tickets)
- Organic search traffic growth (SEO)
- Fraud/chargeback rate

---

## 3. Target Audience & Personas

### 3.1 Customers (B2C shoppers)
- **The Upgrader** — wants the newest flagship phone/laptop, cares about trade-in and financing.
- **The Value Shopper** — compares prices, uses coupons/wishlist, sensitive to shipping cost and delivery time.
- **The Gift Buyer** — buys smartwatches/accessories as gifts, relies on gift cards and fast shipping.
- **The Home Upgrader** — buys kitchen appliances and home electronics, cares about warranty and reviews.

### 3.2 Sellers (B2B vendors)
- Independent electronics retailers and brands who want a storefront presence without building their own e-commerce stack. Need inventory tools, order management, payouts, and analytics.

### 3.3 Admins (internal operations)
- Durchex D.A.M staff managing catalog, sellers, orders, fraud, content, and platform configuration.

---

## 4. Scope — Core Feature Set

### 4.1 Storefront & Shopping Experience
- Home, Shop (all products), Category & Sub-category pages, Product Detail Pages (PDP), Search Results
- Cart, Checkout (guest + authenticated), Wishlist, Compare (side-by-side spec comparison)
- Customer Dashboard (orders, addresses, payment methods, reward points, referrals)
- Order Tracking, Returns & Refunds workflow
- Blog / Editorial content (buying guides, reviews)
- Support Center, Contact, FAQ, Legal/Policy pages (Privacy, Terms, Shipping, Returns)

### 4.2 Discovery & Intelligence
- AI-powered Search (semantic/typo-tolerant) with autocomplete
- AI Recommendations (personalized "for you", "frequently bought together", "similar products")
- Voice Search
- Smart Filters (dynamic facets per category: RAM, storage, screen size, brand, price range, rating)

### 4.3 Internationalization & Commerce
- **v1 launch locale: English only, Nigerian Naira (NGN) only.** i18n and multi-currency infrastructure (locale routing, currency formatting/conversion layer) is built from the start so additional languages/currencies can be enabled later without re-architecture — but only the English/NGN locale ships with content and is checkout-enabled at launch.
- Reward Points program, Coupons/Promo codes, Gift Cards, Referral Program

### 4.4 Engagement & Support
- Live Chat (in-app support widget)
- WhatsApp Support deep-link/integration
- Newsletter signup & campaigns

### 4.5 Payments
- **Primary (Africa-first):** Flutterwave & Paystack — cards, bank transfer, USSD, mobile money, all settling in NGN. These are the default checkout options presented to customers.
- **Secondary (global):** Stripe, PayPal, Apple Pay, Google Pay — available at checkout for international cards, built and wired but positioned below the primary options in the UI.
- Internal Wallet (store credit, refunds, gift card balance)
- Direct Bank Transfer (manual/verified)

### 4.6 Seller Operations (Seller Dashboard)
- Product listing management (CRUD, variants, bulk upload)
- Order management & fulfillment
- Inventory management & low-stock alerts
- Payout/earnings tracking
- Seller-level analytics

### 4.7 Platform Operations (Admin Dashboard)
- Catalog & category management, CMS (banners, pages, blog)
- Seller approval & management
- Order, payment, and refund oversight
- User & role management (RBAC)
- Analytics & Reports (sales, traffic, conversion)
- SEO tools (meta management, sitemap/robots control)
- Fraud detection monitoring & manual review queue
- Coupon / gift card / reward program configuration

### 4.8 Platform-Wide Non-Functional Requirements
- **Security:** JWT auth with refresh tokens, 2FA (TOTP), RBAC (Customer/Seller/Admin + granular admin permissions), CSRF protection, XSS sanitization, rate limiting, input validation, fraud detection heuristics, PCI-compliant payment handling (no raw card data touches our servers).
- **SEO:** Server-rendered pages (Next.js), JSON-LD structured data (Product, Breadcrumb, Organization), dynamic meta tags & Open Graph, XML sitemap, robots.txt, Core Web Vitals optimization, canonical URLs.
- **Performance & Scalability:** Redis caching (sessions, hot product data, cart), Cloudinary for optimized media delivery, CDN via Vercel, database indexing and read-optimized queries via Prisma, horizontal scalability via Docker.
- **Accessibility:** WCAG 2.1 AA target — semantic HTML, keyboard navigation, color contrast, alt text.
- **Responsiveness:** Fully responsive across mobile, tablet, and desktop breakpoints.
- **Branding:** Every page footer displays "Powered by Durchex D.A.M Company LTD".

---

## 5. User Roles & Permissions

| Role | Access |
|---|---|
| **Guest** | Browse, search, add to cart (session-based), guest checkout |
| **Customer** | Full storefront + Customer Dashboard (orders, wishlist, rewards, addresses, returns) |
| **Seller** | Seller Dashboard (own products, orders, inventory, payouts, analytics) — no access to other sellers' data |
| **Admin (Support)** | Order/customer support tools, read-mostly access to orders & tickets |
| **Admin (Catalog Manager)** | Catalog, CMS, SEO tools |
| **Admin (Super Admin)** | Full platform access: users, roles, sellers, payments config, fraud review, system settings |

Role-based access is enforced at both the API layer (middleware) and UI layer (route guards).

---

## 6. Product Catalog Taxonomy (initial)

1. **Smartphones** — Flagship, Mid-range, Budget, Foldables, Accessories (cases, chargers)
2. **Laptops & Computers** — Ultrabooks, Gaming Laptops, 2-in-1s, Desktops, Monitors, Peripherals
3. **Gaming** — Consoles, Controllers, Gaming Accessories, VR
4. **Wearables** — Smartwatches, Fitness Trackers, Bands & Straps
5. **Audio** — Headphones, Earbuds, Speakers
6. **Home Electronics** — TVs, Smart Home, Networking
7. **Kitchen Appliances** — Blenders, Microwaves, Coffee Makers, Air Fryers
8. **Accessories** — Cables, Chargers, Cases, Power Banks

Each category supports nested sub-categories and dynamic spec-based attributes for filtering.

---

## 7. Out of Scope (Phase 1)

- Native mobile apps (iOS/Android) — storefront will be responsive web / PWA-ready only
- In-house logistics/shipping carrier integration (Phase 1 uses manual/3rd-party shipping config)
- Marketplace for services (only physical electronics products)
- Live-stream shopping / social commerce

These may be considered in a future phase after core platform launch.

---

## 8. Assumptions & Constraints

- Single Next.js frontend (`apps/web`) and single Express/Node API (`apps/api`) in a monorepo, per required tech stack.
- PostgreSQL via Prisma is the system of record; Redis is cache/session layer only (not source of truth).
- Cloudinary handles all product/media image storage and transformation.
- Deployment target: Vercel for the frontend, containerized (Docker) Node service for the API, PostgreSQL and Redis hosted separately (e.g., managed Postgres + managed Redis).
- Payment providers require live merchant accounts/API keys to be supplied by the business before Milestone 11 can go beyond sandbox/test mode.

---

## 9. Milestone Roadmap

This project is built in the following sequential milestones. Each stops for explicit approval before proceeding:

1. **PRD** *(this document)*
2. Sitemap & User Flows
3. Database & Prisma Schema
4. Folder Structure
5. UI Design System
6. Authentication
7. Frontend Pages
8. Backend APIs
9. Admin Dashboard
10. Seller Dashboard
11. Payment Integration
12. Testing
13. Deployment

---

## 10. Confirmed Launch Decisions

1. **Languages/currencies:** English only, Nigerian Naira (NGN) only at v1 launch. Multi-language/multi-currency infrastructure is still built for future expansion, but only this locale ships with content and checkout enabled.
2. **Payment priority:** Africa-first. Flutterwave and Paystack are the primary/default checkout providers (cards, bank transfer, USSD, mobile money in NGN). Stripe, PayPal, Apple Pay, and Google Pay are built and available as secondary/global options.
3. **Seller model:** Durchex D.A.M Company LTD is the sole seller at v1 launch. The Seller Dashboard and multi-vendor onboarding are fully functional but dormant until the business approves external sellers.
4. **Brand identity:** No existing Zylix brand assets. Milestone 5 (UI Design System) will originate the logo concept, color palette, and typography.

---

**Approval required to proceed to Milestone 2: Sitemap & User Flows.**
