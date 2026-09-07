import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ProductGrid, ProductGridEmpty } from "@/components/storefront/ProductGrid";
import { serverApiRequest } from "@/lib/server-api";
import type { PaginatedResult, ProductSummary } from "@/types/product";

interface BrandPageProps {
  params: Promise<{ brand: string }>;
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { brand } = await params;
  const name = decodeURIComponent(brand);
  return { title: name, description: `Shop ${name} products at ZylixStore.` };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { brand } = await params;
  const name = decodeURIComponent(brand);

  const result = await serverApiRequest<PaginatedResult<ProductSummary>>(
    `/products?brand=${encodeURIComponent(name)}&pageSize=24`,
    { tags: [`brand:${name}`] },
  );
  const products = result?.items ?? [];

  return (
    <Container className="py-12">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">{name}</h1>

      <div className="mt-10">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <ProductGridEmpty message="No products listed under this brand yet." />
        )}
      </div>
    </Container>
  );
}
