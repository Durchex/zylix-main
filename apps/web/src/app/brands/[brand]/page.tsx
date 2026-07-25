import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ProductGrid, ProductGridEmpty } from "@/components/storefront/ProductGrid";
import { serverApiRequest } from "@/lib/server-api";
import type { SellerSummary } from "@/types/seller";
import type { PaginatedResult, ProductSummary } from "@/types/product";

interface BrandPageProps {
  params: Promise<{ brand: string }>;
}

async function getSeller(slug: string) {
  const result = await serverApiRequest<{ seller: SellerSummary }>(`/sellers/${slug}`, {
    tags: [`seller:${slug}`],
  });
  return result?.seller ?? null;
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { brand } = await params;
  const seller = await getSeller(brand);
  if (!seller) return {};
  return { title: seller.storeName, description: seller.description ?? undefined };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { brand } = await params;
  const seller = await getSeller(brand);

  if (!seller) {
    notFound();
  }

  const result = await serverApiRequest<PaginatedResult<ProductSummary>>(
    `/products?seller=${brand}&pageSize=24`,
    { tags: [`seller:${brand}`] },
  );
  const products = result?.items ?? [];

  return (
    <Container className="py-12">
      <div className="flex items-center gap-5">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-neutral-50">
          {seller.logoUrl && (
            <Image src={seller.logoUrl} alt={seller.storeName} fill className="object-cover" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">{seller.storeName}</h1>
          {seller.description && <p className="mt-1 text-neutral-600">{seller.description}</p>}
        </div>
      </div>

      <div className="mt-10">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <ProductGridEmpty message="This seller hasn't listed any products yet." />
        )}
      </div>
    </Container>
  );
}
