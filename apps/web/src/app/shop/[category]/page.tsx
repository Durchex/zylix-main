import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FilterSidebar } from "@/components/storefront/FilterSidebar";
import { ProductGrid, ProductGridEmpty } from "@/components/storefront/ProductGrid";
import { Hero } from "@/components/sections/Hero";
import { CTABanner } from "@/components/sections/CTABanner";
import { FeatureGrid } from "@/components/sections/FeatureGrid";
import { RecentlyViewedSection } from "@/components/sections/RecentlyViewed";
import { serverApiRequest } from "@/lib/server-api";
import type { PaginatedResult, ProductSummary } from "@/types/product";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

function categoryTitle(slug: string) {
  return slug
    .split("-")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const title = categoryTitle(category);
  return {
    title,
    description: `Shop ${title} at Zylix — premium electronics, delivered across Nigeria.`,
  };
}

async function CategoryProductSection({ title, href, query }: { title: string; href: string; query: string }) {
  const result = await serverApiRequest<PaginatedResult<ProductSummary>>(
    `/products${query}`,
    { tags: ["products"] },
  );
  const products = result?.items ?? [];
  if (products.length === 0) return null;

  return (
    <section className="border-t border-neutral-200 py-8 dark:border-surface-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink-900 dark:text-neutral-50">{title}</h2>
        <Link href={href} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
          See all &rsaquo;
        </Link>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;
  const search = await searchParams;
  const title = categoryTitle(category);

  const query = new URLSearchParams();
  query.set("category", category);
  if (search.sort) query.set("sort", search.sort);
  if (search.featured) query.set("featured", search.featured);
  query.set("pageSize", "24");

  const result = await serverApiRequest<PaginatedResult<ProductSummary>>(
    `/products?${query.toString()}`,
    { tags: ["products", `category:${category}`] },
  );
  const products = result?.items ?? [];

  return (
    <Container className="py-6">
      <Hero
        breadcrumb={[{ label: "Shop", href: "/products" }, { label: title }]}
        title={`${title} & Accessories`}
        subtitle={`Browse our full range of ${title.toLowerCase()}, filtered by brand, price, and rating.`}
      />

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <Suspense>
          <FilterSidebar activeCategory={category} />
        </Suspense>
        <div className="flex-1">
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <ProductGridEmpty message="No products in this category yet — check back soon." />
          )}
        </div>
      </div>

      <CategoryProductSection
        title="Top rated"
        href={`/shop/${category}?sort=rating`}
        query={`?category=${category}&sort=rating&pageSize=8`}
      />

      <CTABanner
        title="Zylix Express delivery"
        subtitle="Get select items from this category delivered faster from our local warehouses."
        cta={{ label: "See eligible items", href: "/deals" }}
      />

      <RecentlyViewedSection />

      <CategoryProductSection
        title="You might also like"
        href="/products?featured=true"
        query="?featured=true&pageSize=8"
      />

      <FeatureGrid
        items={[
          { title: "100% Authentic Products", description: "Every item is verified before it's listed on Zylix." },
          { title: "Secure Payment", description: "Pay safely with Flutterwave, Paystack, cards, or mobile money." },
          { title: "Free Returns within 14 Days", description: "Not the right fit? Send it back at no extra cost." },
        ]}
      />
    </Container>
  );
}
