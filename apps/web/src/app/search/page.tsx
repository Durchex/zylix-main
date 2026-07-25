import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ProductGrid, ProductGridEmpty } from "@/components/storefront/ProductGrid";
import { serverApiRequest } from "@/lib/server-api";
import type { PaginatedResult, ProductSummary } from "@/types/product";

export const metadata: Metadata = {
  title: "Search Results",
  robots: { index: false },
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const result = query
    ? await serverApiRequest<PaginatedResult<ProductSummary>>(
        `/products?search=${encodeURIComponent(query)}&pageSize=24`,
        { revalidate: 0 },
      )
    : null;
  const products = result?.items ?? [];

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">
        {query ? (
          <>
            Search results for <span className="text-brand-600">&ldquo;{query}&rdquo;</span>
          </>
        ) : (
          "Search"
        )}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {query ? `${products.length} result${products.length === 1 ? "" : "s"}` : "Enter a search term above."}
      </p>
      <div className="mt-8">
        {query && products.length === 0 ? (
          <ProductGridEmpty message={`No results for "${query}".`} />
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </Container>
  );
}
