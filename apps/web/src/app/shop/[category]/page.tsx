import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FilterSidebar } from "@/components/storefront/FilterSidebar";
import { ProductGrid, ProductGridEmpty } from "@/components/storefront/ProductGrid";
import { Pagination } from "@/components/storefront/Pagination";
import { ListingToolbar } from "@/components/storefront/ListingToolbar";
import { ProductRail } from "@/components/storefront/ProductRail";
import { RecentlyViewedSection } from "@/components/storefront/RecentlyViewedSection";
import { ExpressDeliveryCTA } from "@/components/shop/ExpressDeliveryCTA";
import { TrustBadges, AUTHENTICITY_TRUST_FEATURES } from "@/components/home/TrustBadges";
import { serverApiRequest } from "@/lib/server-api";
import type { PaginatedResult, ProductSummary } from "@/types/product";

const PAGE_SIZE = 24;

/** Filters forwarded to the API and preserved across pagination. */
const FILTER_KEYS = ["sort", "featured", "brand", "minPrice", "maxPrice", "availability"] as const;

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

  const page = Math.max(1, Number(search.page) || 1);

  const query = new URLSearchParams();
  query.set("category", category);
  for (const key of FILTER_KEYS) {
    const value = search[key];
    if (value) query.set(key, value);
  }
  query.set("page", String(page));
  query.set("pageSize", String(PAGE_SIZE));

  const result = await serverApiRequest<PaginatedResult<ProductSummary>>(
    `/products?${query.toString()}`,
    { tags: ["products", `category:${category}`] },
  );
  const products = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;

  function buildHref(targetPage: number) {
    const next = new URLSearchParams();
    for (const key of FILTER_KEYS) {
      const value = search[key];
      if (value) next.set(key, value);
    }
    if (targetPage > 1) next.set("page", String(targetPage));
    const queryString = next.toString();
    return queryString ? `/shop/${category}?${queryString}` : `/shop/${category}`;
  }

  const firstOnPage = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastOnPage = Math.min(page * PAGE_SIZE, total);

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
        <div className="min-w-0 flex-1">
          <Suspense>
            <ListingToolbar first={firstOnPage} last={lastOnPage} total={total} />
          </Suspense>

          <div className="mt-5">
            {products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              <ProductGridEmpty message="No products in this category yet — check back soon." />
            )}
          </div>

          <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
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
