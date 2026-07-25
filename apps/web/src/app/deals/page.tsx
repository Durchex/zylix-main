import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ProductGrid, ProductGridEmpty } from "@/components/storefront/ProductGrid";
import { serverApiRequest } from "@/lib/server-api";
import type { PaginatedResult, ProductSummary } from "@/types/product";

export const metadata: Metadata = {
  title: "Deals",
  description: "Discounted smartphones, laptops, and electronics at Zylix.",
};

export default async function DealsPage() {
  const result = await serverApiRequest<PaginatedResult<ProductSummary>>(
    "/products?onSale=true&pageSize=24",
    { tags: ["products"] },
  );
  const products = result?.items ?? [];

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">Deals</h1>
      <p className="mt-2 max-w-xl text-neutral-600">
        Limited-time price drops across the Zylix catalog.
      </p>
      <div className="mt-8">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <ProductGridEmpty message="No active deals right now — check back soon." />
        )}
      </div>
    </Container>
  );
}
