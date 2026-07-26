import Link from "next/link";
import { ProductGrid, ProductGridEmpty } from "@/components/storefront/ProductGrid";
import { CountdownTimer } from "@/components/home/CountdownTimer";
import { serverApiRequest } from "@/lib/server-api";
import type { PaginatedResult, ProductSummary } from "@/types/product";

function endOfTodayIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
}

export async function DealsOfTheDaySection() {
  const result = await serverApiRequest<PaginatedResult<ProductSummary>>(
    "/products?pageSize=24",
    { tags: ["products"] },
  );
  const items = result?.items ?? [];
  const deals = items
    .filter((product) => Number(product.compareAtPrice ?? 0) > Number(product.basePrice))
    .slice(0, 8);

  return (
    <section className="border-t border-neutral-200 py-8 dark:border-surface-800">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink-900 dark:text-neutral-50">Deals of the day</h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Limited-time markdowns — refreshed daily.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CountdownTimer targetIso={endOfTodayIso()} />
          <Link href="/deals" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            See all &rsaquo;
          </Link>
        </div>
      </div>
      {deals.length > 0 ? (
        <ProductGrid products={deals} />
      ) : (
        <ProductGridEmpty message="No active markdowns right now — check back soon." />
      )}
    </section>
  );
}
