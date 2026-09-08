"use client";

import { useState } from "react";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { cn } from "@/lib/utils";
import type { CategorySummary, ProductSummary } from "@/types/product";

const VISIBLE_COUNT = 5;

export function FeaturedProductTabs({
  products,
  categories,
}: {
  products: ProductSummary[];
  categories: CategorySummary[];
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const filtered = activeSlug
    ? products.filter((product) => product.category?.slug === activeSlug)
    : products;

  return (
    <>
      {categories.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          <TabButton active={activeSlug === null} onClick={() => setActiveSlug(null)}>
            All
          </TabButton>
          {categories.map((category) => (
            <TabButton
              key={category.id}
              active={activeSlug === category.slug}
              onClick={() => setActiveSlug(category.slug)}
            >
              {category.name}
            </TabButton>
          ))}
        </div>
      )}

      <div className="mt-6">
        <ProductGrid products={filtered.slice(0, VISIBLE_COUNT)} columns={5} />
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-brand-600 text-white"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-surface-800 dark:text-neutral-300 dark:hover:bg-surface-700",
      )}
    >
      {children}
    </button>
  );
}
