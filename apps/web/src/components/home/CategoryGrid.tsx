import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { serverApiRequest } from "@/lib/server-api";
import type { CategorySummary } from "@/types/product";

/**
 * "Shop by Category" tiles, driven by the real Category collection rather
 * than a hardcoded list — the storefront's categories are admin-managed, so
 * hardcoding them here would go stale the moment one is renamed or added.
 *
 * A category with no imageUrl falls back to a generic icon; there's no
 * per-category icon field on the model, and inventing one for a decorative
 * tile isn't worth a schema change.
 */
export async function CategoryGrid() {
  const result = await serverApiRequest<{ categories: CategorySummary[] }>("/categories", {
    tags: ["categories"],
  });
  const categories = (result?.categories ?? []).filter((c) => !c.parentId);

  if (categories.length === 0) return null;

  return (
    <Container className="py-10">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight text-ink-900 dark:text-neutral-50 sm:text-2xl">
          Shop by Category
        </h2>
        <Link
          href="/shop"
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:underline dark:text-accent-400"
        >
          View All Categories
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 10h11M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/shop/${category.slug}`}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-elevated dark:border-surface-800 dark:bg-surface-900 dark:hover:border-brand-600"
          >
            <div className="relative flex h-20 w-full items-center justify-center rounded-xl bg-neutral-50 dark:bg-surface-800">
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 14vw, (min-width: 640px) 30vw, 45vw"
                  className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-9 w-9 text-brand-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="4" width="18" height="13" rx="2" />
                  <path d="M9 21h6M12 17v4" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <span className="text-sm font-semibold text-ink-900 dark:text-neutral-100">
              {category.name}
            </span>
            <span className="text-brand-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-accent-400">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 10h11M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </Container>
  );
}
