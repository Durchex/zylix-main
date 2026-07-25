import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ProductGrid, ProductGridEmpty } from "@/components/storefront/ProductGrid";
import { serverApiRequest } from "@/lib/server-api";
import type { PaginatedResult, ProductSummary } from "@/types/product";

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "The latest smartphones, laptops, and electronics to land at Zylix.",
};

export default async function NewArrivalsPage() {
  const result = await serverApiRequest<PaginatedResult<ProductSummary>>(
    "/products?sort=newest&pageSize=24",
    { tags: ["products"] },
  );
  const products = result?.items ?? [];

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">New Arrivals</h1>
      <p className="mt-2 max-w-xl text-neutral-600">
        The newest additions to the Zylix catalog, freshly stocked.
      </p>
      <div className="mt-8">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <ProductGridEmpty message="No new arrivals yet — check back soon." />
        )}
      </div>
    </Container>
  );
}
