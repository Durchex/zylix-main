import Link from "next/link";
import { ProductGrid, ProductGridEmpty } from "@/components/storefront/ProductGrid";
import { serverApiRequest } from "@/lib/server-api";
import type { PaginatedResult, ProductSummary } from "@/types/product";

export async function ProductRail({
  title,
  description,
  href,
  query,
  emptyMessage = "Catalog coming soon — check back shortly.",
}: {
  title: string;
  description?: string;
  href: string;
  query: string;
  emptyMessage?: string;
}) {
  // Deliberately not wrapped in <Suspense> — on Netlify's Next.js Runtime,
  // Suspense boundaries around async Server Components got stuck in their
  // fallback state forever. A plain top-level await renders reliably
  // instead, at the cost of the per-section skeleton streaming effect.
  const result = await serverApiRequest<PaginatedResult<ProductSummary>>(
    `/products${query}`,
    { tags: ["products"] },
  );
  const products = result?.items ?? [];

  return (
    <section className="border-t border-neutral-200 py-8 dark:border-surface-800">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink-900 dark:text-neutral-50">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
          )}
        </div>
        <Link href={href} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
          See all &rsaquo;
        </Link>
      </div>
      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <ProductGridEmpty message={emptyMessage} />
      )}
    </section>
  );
}
