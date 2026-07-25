"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ProductGrid, ProductGridSkeleton } from "@/components/storefront/ProductGrid";
import { apiRequest } from "@/lib/api-client";
import { useWishlistStore } from "@/store/wishlist.store";
import type { ProductSummary } from "@/types/product";

function EmptyWishlist() {
  return (
    <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 py-16 text-center">
      <p className="text-neutral-500">Your wishlist is empty.</p>
      <Link href="/shop" className="mt-4">
        <Button variant="outline">Browse products</Button>
      </Link>
    </div>
  );
}

export default function WishlistPage() {
  const productIds = useWishlistStore((s) => s.productIds);
  const [products, setProducts] = useState<ProductSummary[] | null>(null);

  useEffect(() => {
    if (productIds.length === 0) return;

    let cancelled = false;
    apiRequest<{ items: ProductSummary[] }>(`/products?ids=${productIds.join(",")}`)
      .then((res) => {
        if (!cancelled) setProducts(res.items);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [productIds]);

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">My Wishlist</h1>

      {productIds.length === 0 ? (
        <EmptyWishlist />
      ) : products === null ? (
        <div className="mt-8">
          <ProductGridSkeleton count={4} />
        </div>
      ) : products.length === 0 ? (
        <EmptyWishlist />
      ) : (
        <div className="mt-8">
          <ProductGrid products={products} />
        </div>
      )}
    </Container>
  );
}
