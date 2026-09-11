import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FeaturedProductTabs } from "@/components/home/FeaturedProductTabs";
import { serverApiRequest } from "@/lib/server-api";
import type { CategorySummary, PaginatedResult, ProductSummary } from "@/types/product";

/**
 * Products an admin has flagged as featured, with category tabs.
 *
 * The filter is `featured=true` and nothing else. It previously fetched by
 * rating with no featured filter at all, so the section showed whatever
 * happened to sort first — arbitrary products under a heading claiming they
 * were featured, and no way for an admin to influence it by ticking the box
 * on a product.
 *
 * Renders nothing when no product is flagged. A promotional rail with no
 * chosen products has nothing to say, and quietly filling it with stand-ins
 * is what caused the original problem.
 *
 * Categories come along so tabs can filter the set client-side — a tab switch
 * shouldn't cost a round trip for a set this small, and the products endpoint
 * already returns each product's category.
 */
export async function FeaturedProducts() {
  const [productResult, categoryResult] = await Promise.all([
    serverApiRequest<PaginatedResult<ProductSummary>>("/products?featured=true&pageSize=24", {
      tags: ["products"],
    }),
    serverApiRequest<{ categories: CategorySummary[] }>("/categories", { tags: ["categories"] }),
  ]);

  const products = productResult?.items ?? [];
  if (products.length === 0) return null;

  // Only offer tabs for categories that actually have something behind them
  // in this result set — an empty tab is a dead end.
  const representedSlugs = new Set(products.map((p) => p.category?.slug).filter(Boolean));
  const categories = (categoryResult?.categories ?? []).filter((c) => representedSlugs.has(c.slug));

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight text-ink-900 dark:text-neutral-50 sm:text-2xl">
          Featured Products
        </h2>
        <Link
          href="/shop?featured=true"
          className="text-sm font-semibold text-brand-600 hover:underline dark:text-accent-400"
        >
          View all
        </Link>
      </div>

      <FeaturedProductTabs products={products} categories={categories} />
    </Container>
  );
}
