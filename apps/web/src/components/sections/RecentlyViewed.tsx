"use client";

import { useEffect } from "react";
import { useRecentlyViewedStore } from "@/store/recentlyViewed.store";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import type { ProductSummary } from "@/types/product";

export function TrackRecentlyViewed({ product }: { product: ProductSummary }) {
  const add = useRecentlyViewedStore((s) => s.add);

  useEffect(() => {
    add(product);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- record once per product view, not on every store identity change
  }, [product.id]);

  return null;
}

export function RecentlyViewedSection({ excludeProductId }: { excludeProductId?: string }) {
  const products = useRecentlyViewedStore((s) => s.products).filter((p) => p.id !== excludeProductId);

  if (products.length === 0) return null;

  return (
    <section className="border-t border-neutral-200 py-8 dark:border-surface-800">
      <h2 className="mb-4 text-lg font-bold text-ink-900 dark:text-neutral-50">Recently viewed</h2>
      <ProductGrid products={products} />
    </section>
  );
}
