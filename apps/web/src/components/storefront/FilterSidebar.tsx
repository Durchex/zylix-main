"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";

const CATEGORIES = [
  { name: "Smartphones", slug: "smartphones" },
  { name: "Laptops", slug: "laptops" },
  { name: "Gaming", slug: "gaming" },
  { name: "Smartwatches", slug: "smartwatches" },
  { name: "Accessories", slug: "accessories" },
  { name: "Home Electronics", slug: "home-electronics" },
  { name: "Kitchen Appliances", slug: "kitchen-appliances" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

export function FilterSidebar({ activeCategory }: { activeCategory?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const selectedCategory = activeCategory ?? searchParams.get("category") ?? "";

  return (
    <aside className="w-full shrink-0 space-y-6 lg:w-64">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-neutral-100">Sort by</h3>
        <Select
          aria-label="Sort products"
          value={searchParams.get("sort") ?? "newest"}
          onChange={(e) => updateParam("sort", e.target.value)}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      {!activeCategory && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-neutral-100">Category</h3>
          <ul className="space-y-2">
            {CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Checkbox
                  label={cat.name}
                  checked={selectedCategory === cat.slug}
                  onChange={(e) => updateParam("category", e.target.checked ? cat.slug : null)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-neutral-100">Featured only</h3>
        <Checkbox
          label="Show featured products"
          checked={searchParams.get("featured") === "true"}
          onChange={(e) => updateParam("featured", e.target.checked ? "true" : null)}
        />
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(pathname)}
        className="w-full"
      >
        Clear filters
      </Button>
    </aside>
  );
}
