import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FilterSidebar } from "@/components/storefront/FilterSidebar";
import { ProductGrid, ProductGridEmpty } from "@/components/storefront/ProductGrid";
import { serverApiRequest } from "@/lib/server-api";
import type { PaginatedResult, ProductSummary } from "@/types/product";

interface SubcategoryPageProps {
  params: Promise<{ category: string; subcategory: string }>;
}

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: SubcategoryPageProps): Promise<Metadata> {
  const { subcategory } = await params;
  const title = titleFromSlug(subcategory);
  return { title, description: `Shop ${title} at Zylix.` };
}

export default async function SubcategoryPage({ params }: SubcategoryPageProps) {
  const { category, subcategory } = await params;

  const result = await serverApiRequest<PaginatedResult<ProductSummary>>(
    `/products?category=${category}&subcategory=${subcategory}&pageSize=24`,
    { tags: ["products", `category:${category}`] },
  );
  const products = result?.items ?? [];

  return (
    <Container className="py-10">
      <p className="text-sm text-neutral-500">
        {titleFromSlug(category)} / {titleFromSlug(subcategory)}
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900">
        {titleFromSlug(subcategory)}
      </h1>
      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <Suspense>
          <FilterSidebar activeCategory={category} />
        </Suspense>
        <div className="flex-1">
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <ProductGridEmpty message="No products in this sub-category yet — check back soon." />
          )}
        </div>
      </div>
    </Container>
  );
}
