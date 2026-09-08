import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FilterSidebar } from "@/components/storefront/FilterSidebar";
import { ProductGrid, ProductGridEmpty } from "@/components/storefront/ProductGrid";
import { Pagination } from "@/components/storefront/Pagination";
import { ListingToolbar } from "@/components/storefront/ListingToolbar";
import { TrustBadges, WHY_CHOOSE_FEATURES } from "@/components/home/TrustBadges";
import { serverApiRequest } from "@/lib/server-api";
import type { PaginatedResult, ProductSummary } from "@/types/product";

export const metadata: Metadata = {
  title: "All Products",
  description:
    "Browse the full ZylixStore catalog — televisions, audio, home and kitchen appliances, air conditioners and more.",
};

const PAGE_SIZE = 24;

/** Query keys this page forwards to the API and preserves across pagination. */
const FILTER_KEYS = [
  "category",
  "sort",
  "featured",
  "brand",
  "minPrice",
  "maxPrice",
  "availability",
] as const;

interface ShopPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const query = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = params[key];
    if (value) query.set(key, value);
  }
  query.set("page", String(page));
  query.set("pageSize", String(PAGE_SIZE));

  const result = await serverApiRequest<PaginatedResult<ProductSummary>>(
    `/products?${query.toString()}`,
    { tags: ["products"] },
  );

  const products = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;

  function buildHref(targetPage: number) {
    const next = new URLSearchParams();
    for (const key of FILTER_KEYS) {
      const value = params[key];
      if (value) next.set(key, value);
    }
    if (targetPage > 1) next.set("page", String(targetPage));
    const queryString = next.toString();
    return queryString ? `/shop?${queryString}` : "/shop";
  }

  const firstOnPage = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastOnPage = Math.min(page * PAGE_SIZE, total);

  return (
    <Container className="py-8">
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-brand-600">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-ink-900 dark:text-neutral-200">All Products</span>
      </nav>

      <section className="overflow-hidden rounded-2xl bg-gradient-brand px-6 py-10 text-white sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
          Shop All Electronics
        </p>
        <h1 className="mt-2 max-w-xl text-2xl font-bold tracking-tight sm:text-4xl">
          Everything You Need in One Place
        </h1>
        <p className="mt-3 max-w-lg text-sm text-white/85 sm:text-base">
          Discover the latest and best electronics, from TVs to home appliances. Quality products,
          great prices, fast delivery.
        </p>
      </section>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <Suspense>
          <FilterSidebar />
        </Suspense>

        <div className="min-w-0 flex-1">
          <Suspense>
            <ListingToolbar first={firstOnPage} last={lastOnPage} total={total} />
          </Suspense>

          <div className="mt-5">
            {products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              <ProductGridEmpty message="No products match your filters. Try clearing a filter or two." />
            )}
          </div>

          <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </div>

      <TrustBadges features={WHY_CHOOSE_FEATURES} layout="row" />
    </Container>
  );
}
