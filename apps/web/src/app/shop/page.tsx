import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FilterSidebar } from "@/components/storefront/FilterSidebar";
import { ProductGrid, ProductGridEmpty } from "@/components/storefront/ProductGrid";
import { WarrantyReturnsCTA } from "@/components/shop/WarrantyReturnsCTA";
import { LogoStrip } from "@/components/home/LogoStrip";
import { serverApiRequest } from "@/lib/server-api";
import type { PaginatedResult, ProductSummary } from "@/types/product";

export const metadata: Metadata = {
  title: "Shop All Products",
  description: "Browse the full ZylixStore catalog of smartphones, laptops, gaming gear, and more.",
};

const TRUSTED_BRANDS = [
  { name: "Hisense", src: "/brands/hisense.png" },
  { name: "TCL", src: "/brands/tcl.png" },
  { name: "Brühm", src: "/brands/bruhm.png" },
  { name: "Midea", src: "/brands/midea.png" },
  { name: "Firman", src: "/brands/firman.png" },
  { name: "Haier Thermocool", src: "/brands/haier-thermocool.png" },
  { name: "Skyrun", src: "/brands/skyrun.png" },
  { name: "Scanfrost", src: "/brands/scanfrost.png" },
];

interface ShopPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.sort) query.set("sort", params.sort);
  if (params.featured) query.set("featured", params.featured);
  if (params.brand) query.set("brand", params.brand);
  if (params.minPrice) query.set("minPrice", params.minPrice);
  if (params.maxPrice) query.set("maxPrice", params.maxPrice);
  query.set("pageSize", "24");

  const result = await serverApiRequest<PaginatedResult<ProductSummary>>(
    `/products?${query.toString()}`,
    { tags: ["products"] },
  );
  const products = result?.items ?? [];

  return (
    <Container className="py-10">
      <section className="overflow-hidden rounded-2xl bg-gradient-brand px-6 py-10 text-white sm:px-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
          Up to 50% off top brands
        </p>
        <h1 className="mt-2 max-w-xl text-2xl font-bold tracking-tight sm:text-4xl">
          Shop the latest smartphones &amp; appliances.
        </h1>
        <p className="mt-3 max-w-lg text-sm text-white/85 sm:text-base">
          The full ZylixStore catalog — authenticated stock, official warranty, and nationwide
          delivery on every order.
        </p>
      </section>

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

      <div className="mt-10">
        <WarrantyReturnsCTA />
      </div>

      <LogoStrip eyebrow="Trusted brands" title="Every brand available on ZylixStore" items={TRUSTED_BRANDS} />
    </Container>
  );
}
