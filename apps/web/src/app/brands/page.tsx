import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { serverApiRequest } from "@/lib/server-api";
import type { SellerSummary } from "@/types/seller";

export const metadata: Metadata = {
  title: "Brands & Sellers",
  description: "Browse every brand and approved seller on Zylix.",
};

export default async function BrandsPage() {
  const result = await serverApiRequest<{ sellers: SellerSummary[] }>("/sellers", {
    tags: ["sellers"],
  });
  const sellers = result?.sellers ?? [];

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">Brands & Sellers</h1>
      <p className="mt-2 max-w-xl text-neutral-600">
        Every seller on Zylix is verified before their products go live.
      </p>

      {sellers.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 py-16 text-center">
          <p className="text-neutral-500">No sellers listed yet — check back soon.</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sellers.map((seller) => (
            <Link
              key={seller.id}
              href={`/brands/${seller.storeSlug}`}
              className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 hover:border-brand-300 hover:shadow-soft"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-neutral-50">
                {seller.logoUrl && (
                  <Image src={seller.logoUrl} alt={seller.storeName} fill className="object-cover" />
                )}
              </div>
              <div>
                <p className="font-semibold text-ink-900">{seller.storeName}</p>
                {seller.description && (
                  <p className="line-clamp-1 text-sm text-neutral-500">{seller.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
