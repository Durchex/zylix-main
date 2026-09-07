import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { serverApiRequest } from "@/lib/server-api";

interface BrandListing {
  name: string;
  productCount: number;
}

export const metadata: Metadata = {
  title: "Shop by Brand",
  description: "Browse the ZylixStore catalog by manufacturer brand.",
};

export default async function BrandsPage() {
  const result = await serverApiRequest<{ brands: BrandListing[] }>("/products/brands", {
    tags: ["brands"],
  });
  const brands = result?.brands ?? [];

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">Shop by Brand</h1>
      <p className="mt-2 max-w-xl text-neutral-600">
        Browse our catalog by manufacturer brand.
      </p>

      {brands.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 py-16 text-center">
          <p className="text-neutral-500">No brands listed yet — check back soon.</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link
              key={brand.name}
              href={`/brands/${encodeURIComponent(brand.name)}`}
              className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-5 hover:border-brand-300 hover:shadow-soft"
            >
              <p className="font-semibold text-ink-900">{brand.name}</p>
              <p className="text-sm text-neutral-500">
                {brand.productCount} product{brand.productCount === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
