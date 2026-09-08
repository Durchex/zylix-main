"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { CategorySummary } from "@/types/product";

interface BrandListing {
  name: string;
  productCount: number;
}

/**
 * Preset bands rather than free min/max inputs — faster to use on the common
 * case, and every band maps onto the same minPrice/maxPrice query the API
 * already understands.
 */
const PRICE_RANGES = [
  { id: "under-50k", label: "Under ₦50,000", min: null, max: 50_000 },
  { id: "50k-100k", label: "₦50,000 – ₦100,000", min: 50_000, max: 100_000 },
  { id: "100k-200k", label: "₦100,000 – ₦200,000", min: 100_000, max: 200_000 },
  { id: "200k-500k", label: "₦200,000 – ₦500,000", min: 200_000, max: 500_000 },
  { id: "over-500k", label: "Over ₦500,000", min: 500_000, max: null },
] as const;

export function FilterSidebar({ activeCategory }: { activeCategory?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [brands, setBrands] = useState<BrandListing[]>([]);
  const [brandQuery, setBrandQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiRequest<{ categories: CategorySummary[] }>("/categories"),
      apiRequest<{ brands: BrandListing[] }>("/products/brands"),
    ])
      .then(([categoryRes, brandRes]) => {
        if (cancelled) return;
        setCategories(categoryRes.categories.filter((c) => !c.parentId));
        setBrands(brandRes.brands);
      })
      // Filters failing to load shouldn't blank the sidebar's other controls.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  function updateParams(entries: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(entries)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    // Any filter change invalidates the current page offset.
    params.delete("page");
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  const selectedCategory = activeCategory ?? searchParams.get("category") ?? "";
  const selectedBrands = (searchParams.get("brand") ?? "").split(",").filter(Boolean);
  const availability = searchParams.get("availability");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const activeRangeId = PRICE_RANGES.find(
    (range) =>
      String(range.min ?? "") === (minPrice ?? "") && String(range.max ?? "") === (maxPrice ?? ""),
  )?.id;

  function toggleBrand(name: string) {
    const next = selectedBrands.includes(name)
      ? selectedBrands.filter((b) => b !== name)
      : [...selectedBrands, name];
    updateParams({ brand: next.length > 0 ? next.join(",") : null });
  }

  const visibleBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandQuery.trim().toLowerCase()),
  );

  const hasActiveFilters =
    Boolean(searchParams.toString()) && Array.from(searchParams.keys()).some((k) => k !== "page");

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900 dark:text-neutral-100">
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-brand-600" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 5h14M6 10h8M8.5 15h3" strokeLinecap="round" />
            </svg>
            Filter Products
          </h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => router.push(pathname)}
              className="text-xs font-medium text-brand-600 hover:underline dark:text-accent-400"
            >
              Clear All
            </button>
          )}
        </div>

        {!activeCategory && categories.length > 0 && (
          <FilterGroup title="Category">
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id} className="flex items-center justify-between gap-2">
                  <Checkbox
                    label={category.name}
                    checked={selectedCategory === category.slug}
                    onChange={(e) => updateParams({ category: e.target.checked ? category.slug : null })}
                  />
                  {typeof category.productCount === "number" && (
                    <span className="shrink-0 text-xs text-neutral-400">{category.productCount}</span>
                  )}
                </li>
              ))}
            </ul>
          </FilterGroup>
        )}

        <FilterGroup title="Price Range">
          <ul className="space-y-2">
            {PRICE_RANGES.map((range) => (
              <li key={range.id}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <input
                    type="radio"
                    name="price-range"
                    checked={activeRangeId === range.id}
                    onChange={() =>
                      updateParams({
                        minPrice: range.min === null ? null : String(range.min),
                        maxPrice: range.max === null ? null : String(range.max),
                      })
                    }
                    className="h-4 w-4 accent-brand-600"
                  />
                  {range.label}
                </label>
              </li>
            ))}
          </ul>
          {activeRangeId && (
            <button
              type="button"
              onClick={() => updateParams({ minPrice: null, maxPrice: null })}
              className="mt-2 text-xs font-medium text-brand-600 hover:underline dark:text-accent-400"
            >
              Clear price
            </button>
          )}
        </FilterGroup>

        {brands.length > 0 && (
          <FilterGroup title="Brand">
            <Input
              aria-label="Search brands"
              placeholder="Search brands..."
              value={brandQuery}
              onChange={(e) => setBrandQuery(e.target.value)}
              className="mb-3"
            />
            <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {visibleBrands.length === 0 ? (
                <li className="text-xs text-neutral-400">No brands match that search.</li>
              ) : (
                visibleBrands.map((brand) => (
                  <li key={brand.name} className="flex items-center justify-between gap-2">
                    <Checkbox
                      label={brand.name}
                      checked={selectedBrands.includes(brand.name)}
                      onChange={() => toggleBrand(brand.name)}
                    />
                    <span className="shrink-0 text-xs text-neutral-400">{brand.productCount}</span>
                  </li>
                ))
              )}
            </ul>
          </FilterGroup>
        )}

        <FilterGroup title="Availability">
          <ul className="space-y-2">
            <li>
              <Checkbox
                label="In Stock"
                checked={availability === "in"}
                onChange={(e) => updateParams({ availability: e.target.checked ? "in" : null })}
              />
            </li>
            <li>
              <Checkbox
                label="Out of Stock"
                checked={availability === "out"}
                onChange={(e) => updateParams({ availability: e.target.checked ? "out" : null })}
              />
            </li>
          </ul>
        </FilterGroup>

        <FilterGroup title="Offers">
          <Checkbox
            label="Featured products only"
            checked={searchParams.get("featured") === "true"}
            onChange={(e) => updateParams({ featured: e.target.checked ? "true" : null })}
          />
        </FilterGroup>
      </div>
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cn("mt-5 border-t border-neutral-200 pt-5 dark:border-surface-800")}>
      <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-neutral-100">{title}</h3>
      {children}
    </div>
  );
}
