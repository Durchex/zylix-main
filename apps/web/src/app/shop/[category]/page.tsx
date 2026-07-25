import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FilterSidebar } from "@/components/storefront/FilterSidebar";
import { ProductGrid, ProductGridEmpty } from "@/components/storefront/ProductGrid";
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

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;
  const search = await searchParams;

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
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">
        {categoryTitle(category)}
      </h1>
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
    </Container>
  );
}
