"use client";

import Link from "next/link";
import Image from "next/image";
import { useRecentlyViewedStore } from "@/store/recentlyViewed.store";
import { formatPrice } from "@/lib/utils";

export function RecentlyViewedSection({ excludeSlug }: { excludeSlug?: string }) {
  const items = useRecentlyViewedStore((s) => s.items).filter((item) => item.slug !== excludeSlug);

  // Empty on the server (nothing persisted yet) and briefly on first client
  // render until Zustand's persist middleware rehydrates from localStorage —
  // rendering nothing in both cases avoids a hydration mismatch.
  if (items.length === 0) return null;

  return (
    <section className="border-t border-neutral-200 py-8 dark:border-surface-800">
      <h2 className="text-lg font-bold text-ink-900 dark:text-neutral-50">Recently viewed</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.slug}`}
            className="rounded-xl border border-neutral-200 bg-white p-3 hover:border-brand-400 dark:border-surface-800 dark:bg-surface-900"
          >
            <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-50 dark:bg-surface-800">
              {item.imageUrl && (
                <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-2" />
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-xs font-medium text-ink-900 dark:text-neutral-100">
              {item.name}
            </p>
            <p className="mt-1 text-xs font-semibold text-ink-900 dark:text-neutral-100">
              {formatPrice(Number(item.price), item.currency)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
