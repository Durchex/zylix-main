import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FilterSidebar } from "@/components/storefront/FilterSidebar";
import { ProductGrid, ProductGridEmpty } from "@/components/storefront/ProductGrid";
import { ProductRail } from "@/components/storefront/ProductRail";
import { RecentlyViewedSection } from "@/components/storefront/RecentlyViewedSection";
import { ExpressDeliveryCTA } from "@/components/shop/ExpressDeliveryCTA";
import { TrustBadges, AUTHENTICITY_TRUST_FEATURES } from "@/components/home/TrustBadges";
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
    description: `Shop ${title} at ZylixStore — premium electronics, delivered across Nigeria.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;
  const search = await searchParams;
  const title = categoryTitle(category);

  const query = new URLSearchParams();
  query.set("category", category);
  if (search.sort) query.set("sort", search.sort);
  if (search.featured) query.set("featured", search.featured);
  if (search.brand) query.set("brand", search.brand);
  if (search.minPrice) query.set("minPrice", search.minPrice);
  if (search.maxPrice) query.set("maxPrice", search.maxPrice);
  query.set("pageSize", "24");

  const result = await serverApiRequest<PaginatedResult<ProductSummary>>(
    `/products?${query.toString()}`,
    { tags: ["products", `category:${category}`] },
  );
  const products = result?.items ?? [];

  return (
    <Container className="py-10">
      <nav className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
        <Link href="/" className="hover:text-ink-900 dark:hover:text-neutral-100">
          Home
        </Link>{" "}
        /{" "}
        <Link href="/shop" className="hover:text-ink-900 dark:hover:text-neutral-100">
          Shop
        </Link>{" "}
        / <span className="text-ink-900 dark:text-neutral-100">{title}</span>
      </nav>

      <section className="overflow-hidden rounded-2xl bg-gradient-brand px-6 py-8 text-white sm:px-10 sm:py-10">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-lg text-sm text-white/85">
          Browse every {title.toLowerCase()} on ZylixStore — authenticated stock, official
          warranty, and nationwide delivery.
        </p>
      </section>

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

      <ProductRail
        title="Top rated"
        description={`Highest-rated ${title.toLowerCase()}, based on verified buyer reviews.`}
        href={`/shop/${category}?sort=rating`}
        query={`?category=${category}&sort=rating&pageSize=8`}
        emptyMessage="No rated products in this category yet."
      />

      <div className="py-8">
        <ExpressDeliveryCTA />
      </div>

      <RecentlyViewedSection />

      <ProductRail
        title="You might also like"
        description="More picks from this category worth a look."
        href={`/shop/${category}?featured=true`}
        query={`?category=${category}&featured=true&pageSize=8`}
        emptyMessage="No recommendations yet — check back soon."
      />

      <TrustBadges features={AUTHENTICITY_TRUST_FEATURES} />
    </Container>
  );
}
