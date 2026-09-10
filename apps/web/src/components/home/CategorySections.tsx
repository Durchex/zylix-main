import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductCarousel } from "@/components/storefront/ProductCarousel";
import { serverApiRequest } from "@/lib/server-api";
import type { CategorySummary, PaginatedResult, ProductSummary } from "@/types/product";

/** How many categories get their own row before the page gets too long. */
const MAX_CATEGORY_SECTIONS = 6;
const PRODUCTS_PER_ROW = 12;

/**
 * One carousel per category, each linking through to that category's filtered
 * listing.
 *
 * Categories are fetched first, then their products in parallel — a single
 * unfiltered product fetch couldn't guarantee enough items from each category
 * to fill a row.
 */
export async function CategorySections() {
  const categoryResult = await serverApiRequest<{ categories: CategorySummary[] }>("/categories", {
    tags: ["categories"],
  });

  const categories = (categoryResult?.categories ?? [])
    .filter((category) => !category.parentId)
    // Skip categories with nothing in them rather than rendering empty rows.
    .filter((category) => (category.productCount ?? 0) > 0)
    .slice(0, MAX_CATEGORY_SECTIONS);

  if (categories.length === 0) return null;

  const sections = await Promise.all(
    categories.map(async (category) => {
      const result = await serverApiRequest<PaginatedResult<ProductSummary>>(
        `/products?category=${encodeURIComponent(category.slug)}&pageSize=${PRODUCTS_PER_ROW}`,
        { tags: ["products", `category:${category.slug}`] },
      );
      return { category, products: result?.items ?? [] };
    }),
  );

  const populated = sections.filter((section) => section.products.length > 0);
  if (populated.length === 0) return null;

  return (
    <Container className="py-4">
      {populated.map(({ category, products }) => (
        <section key={category.id} className="py-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-ink-900 dark:text-neutral-50 sm:text-2xl">
                {category.name}
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {category.productCount} product{category.productCount === 1 ? "" : "s"} available
              </p>
            </div>
            <Link
              href={`/shop?category=${encodeURIComponent(category.slug)}`}
              className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:underline dark:text-accent-400"
            >
              View all
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 10h11M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <ProductCarousel products={products} />
        </section>
      ))}
    </Container>
  );
}
