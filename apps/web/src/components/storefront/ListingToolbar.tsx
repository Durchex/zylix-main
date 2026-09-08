"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Most Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

/**
 * The result count and sort control that sit above the grid. Sorting lives
 * here rather than in the filter sidebar because it's a view preference, not
 * a filter — and it's where shoppers expect to find it.
 */
export function ListingToolbar({
  first,
  last,
  total,
}: {
  first: number;
  last: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSortChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") params.delete("sort");
    else params.set("sort", value);
    // A re-sort invalidates the current offset.
    params.delete("page");
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {total === 0 ? (
          "No products found"
        ) : (
          <>
            Showing{" "}
            <span className="font-semibold text-ink-900 dark:text-neutral-100">
              {first}–{last}
            </span>{" "}
            of <span className="font-semibold text-ink-900 dark:text-neutral-100">{total}</span>{" "}
            products
          </>
        )}
      </p>

      <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <span className="shrink-0">Sort by:</span>
        <Select
          aria-label="Sort products"
          value={searchParams.get("sort") ?? "newest"}
          onChange={(e) => handleSortChange(e.target.value)}
          className="h-9 w-44"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </label>
    </div>
  );
}
