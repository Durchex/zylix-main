import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ProductGrid, ProductGridEmpty } from "@/components/storefront/ProductGrid";
import { serverApiRequest } from "@/lib/server-api";
import type { PaginatedResult, ProductSummary } from "@/types/product";

// Forces a fresh server render on every request instead of Next's default
// static-generation-with-ISR. Netlify's Next.js Runtime doesn't reliably
// re-generate this page on its 60s revalidate schedule (confirmed: the
// homepage kept serving an empty "Catalog coming soon" snapshot from the
// build-time render long after real products existed and the API itself
// was responding correctly and fast) — same category of runtime gap as the
// earlier Suspense-streaming and external-rewrites issues on this host.
export const revalidate = 0;

const FEATURED_CATEGORIES = [
  { name: "Smartphones", slug: "smartphones" },
  { name: "Laptops", slug: "laptops" },
  { name: "Gaming", slug: "gaming" },
  { name: "Smartwatches", slug: "smartwatches" },
  { name: "Accessories", slug: "accessories" },
  { name: "Home Electronics", slug: "home-electronics" },
];

async function ProductSection({
  title,
  href,
  query,
}: {
  title: string;
  href: string;
  query: string;
}) {
  // Deliberately not wrapped in <Suspense> — on Netlify's Next.js Runtime,
  // Suspense boundaries around async Server Components get stuck in their
  // fallback state forever (confirmed via the "<template>" streaming marker
  // never resolving in the shipped HTML, even after a fresh reload). A plain
  // top-level await renders reliably instead, at the cost of the per-section
  // skeleton streaming effect.
  const result = await serverApiRequest<PaginatedResult<ProductSummary>>(
    `/products${query}`,
    { tags: ["products"] },
  );
  const products = result?.items ?? [];

  return (
    <section className="border-t border-neutral-200 py-8 dark:border-surface-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink-900 dark:text-neutral-50">{title}</h2>
        <Link href={href} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
          See all &rsaquo;
        </Link>
      </div>
      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <ProductGridEmpty message="Catalog coming soon — check back shortly." />
      )}
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
        <section className="flex flex-col items-start gap-3 border-b border-neutral-200 py-6 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink-900 dark:text-neutral-50 sm:text-2xl">
              Technology Made Simple.
            </h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Curated, authenticated smartphones, laptops, gaming gear, and home electronics —
              from a store built for the way you actually shop.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href="/shop">
              <Button>Shop all products</Button>
            </Link>
            <Link href="/deals">
              <Button variant="outline">Today&apos;s deals</Button>
            </Link>
          </div>
        </section>

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

        <ProductSection title="Featured products" href="/shop?featured=true" query="?featured=true&pageSize=8" />
        <ProductSection title="New arrivals" href="/new-arrivals" query="?sort=newest&pageSize=8" />
      </Container>
    </>
  );
}
