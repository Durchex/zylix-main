import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FilterSidebar } from "@/components/storefront/FilterSidebar";
import { ProductGrid, ProductGridEmpty } from "@/components/storefront/ProductGrid";
import { serverApiRequest } from "@/lib/server-api";
import type { PaginatedResult, ProductSummary } from "@/types/product";

export const metadata: Metadata = {
  title: "Shop All Products",
  description: "Browse the full Zylix catalog of smartphones, laptops, gaming gear, and more.",
};

interface ShopPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.sort) query.set("sort", params.sort);
  if (params.featured) query.set("featured", params.featured);
  query.set("pageSize", "24");

  const result = await serverApiRequest<PaginatedResult<ProductSummary>>(
    `/products?${query.toString()}`,
    { tags: ["products"] },
  );
  const products = result?.items ?? [];

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">Shop All Products</h1>
      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <Suspense>
          <FilterSidebar />
        </Suspense>
        <div className="flex-1">
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <ProductGridEmpty message="No products match your filters yet — the catalog is being populated." />
          )}
        </div>
      </div>
    </Container>
  );
}
