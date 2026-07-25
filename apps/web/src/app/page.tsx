import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { ProductGrid, ProductGridEmpty, ProductGridSkeleton } from "@/components/storefront/ProductGrid";
import { Hero } from "@/components/sections/Hero";
import { LogoStrip } from "@/components/sections/LogoStrip";
import { CTABanner } from "@/components/sections/CTABanner";
import { FeatureGrid } from "@/components/sections/FeatureGrid";
import { CountdownTimer } from "@/components/sections/CountdownTimer";
import { serverApiRequest } from "@/lib/server-api";
import type { PaginatedResult, ProductSummary } from "@/types/product";

const TRUSTED_BRANDS = ["Samsung", "Apple", "Sony", "LG", "HP", "Dell", "Xiaomi", "JBL"];
const FEATURED_IN = ["TechCrunch", "The Verge", "Best E-commerce App 2024", "Forbes Africa"];

const FEATURED_CATEGORIES = [
  { name: "Smartphones", slug: "smartphones" },
  { name: "Laptops", slug: "laptops" },
  { name: "Gaming", slug: "gaming" },
  { name: "Smartwatches", slug: "smartwatches" },
  { name: "Accessories", slug: "accessories" },
  { name: "Home Electronics", slug: "home-electronics" },
];

async function ProductSectionBody({ query }: { query: string }) {
  const result = await serverApiRequest<PaginatedResult<ProductSummary>>(
    `/products${query}`,
    { tags: ["products"] },
  );
  const products = result?.items ?? [];

  return products.length > 0 ? (
    <ProductGrid products={products} />
  ) : (
    <ProductGridEmpty message="Catalog coming soon — check back shortly." />
  );
}

function ProductSection({
  title,
  href,
  query,
  accessory,
}: {
  title: string;
  href: string;
  query: string;
  accessory?: ReactNode;
}) {
  return (
    <section className="border-t border-neutral-200 py-8 dark:border-surface-800">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-ink-900 dark:text-neutral-50">{title}</h2>
          {accessory}
        </div>
        <Link href={href} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
          See all &rsaquo;
        </Link>
      </div>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductSectionBody query={query} />
      </Suspense>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <div className="bg-brand-700 py-2 text-center text-xs font-medium text-white sm:text-sm">
        Free standard shipping on orders over ₦100,000 — nationwide delivery across Nigeria.
      </div>

      <Container>
        <Hero
          eyebrow="Top deals this week"
          title="Technology Made Simple."
          subtitle="Curated, authenticated smartphones, laptops, gaming gear, and home electronics — from a store built for the way you actually shop."
          ctas={[
            { label: "Shop all products", href: "/products" },
            { label: "Today's deals", href: "/deals", variant: "outline" },
          ]}
        />

        <section className="py-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-900 dark:text-neutral-50">
            Shop by category
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {FEATURED_CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/shop/${category.slug}`}
                className="flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-2 py-3 text-center text-xs font-medium text-ink-900 hover:border-brand-400 hover:text-brand-700 dark:border-surface-800 dark:bg-surface-900 dark:text-neutral-100 dark:hover:border-brand-500 dark:hover:text-brand-400"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>

        <ProductSection title="Featured products" href="/products?featured=true" query="?featured=true&pageSize=8" />
        <ProductSection title="Top selling" href="/products?sort=rating" query="?sort=rating&pageSize=8" />

        <LogoStrip title="Trusted electronics brands" logos={TRUSTED_BRANDS} />

        <ProductSection
          title="Deals of the day"
          href="/deals"
          query="?featured=true&sort=price-asc&pageSize=8"
          accessory={<CountdownTimer />}
        />

        <CTABanner
          title="Get exclusive app-only deals"
          subtitle="Download the Zylix app for faster checkout and deals you won't find on the web."
          cta={{ label: "Download the app", href: "/mobile-app" }}
          tone="dark"
        />

        <FeatureGrid
          items={[
            { title: "Official Warranty", description: "Every product ships with full manufacturer warranty coverage." },
            { title: "Nationwide Delivery", description: "Fast, tracked delivery to every state across Nigeria." },
            { title: "Easy 14-Day Returns", description: "Change your mind? Return unused items within 14 days." },
          ]}
        />

        <LogoStrip title="Featured in" logos={FEATURED_IN} />
      </Container>
    </>
  );
}
