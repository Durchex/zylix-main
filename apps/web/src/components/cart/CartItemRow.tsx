"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import type { CartLineItem } from "@/types/cart";

/**
 * One cart line, shared by the full /cart page and the header drawer so the
 * two can't drift in how they render quantity limits, pricing or removal.
 * `compact` trims it down for the narrower drawer column.
 */
export function CartItemRow({
  item,
  compact = false,
  onNavigate,
}: {
  item: CartLineItem;
  compact?: boolean;
  /** Lets the drawer close itself when a product link is followed. */
  onNavigate?: () => void;
}) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const imageSize = compact ? "h-16 w-16" : "h-20 w-20";

  return (
    <div className="flex gap-3">
      <Link
        href={`/products/${item.slug}`}
        onClick={onNavigate}
        className={`relative ${imageSize} shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-surface-800 dark:bg-surface-800`}
      >
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-1.5" />
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/products/${item.slug}`}
            onClick={onNavigate}
            className="line-clamp-2 text-sm font-medium text-ink-900 hover:text-brand-600 dark:text-neutral-100 dark:hover:text-accent-400"
          >
            {item.name}
          </Link>
          <p className="whitespace-nowrap text-sm font-semibold text-ink-900 dark:text-neutral-100">
            {formatPrice(item.unitPrice * item.quantity, item.currency)}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="inline-flex items-center rounded-lg border border-neutral-300 dark:border-surface-700">
            <button
              type="button"
              aria-label={`Decrease quantity of ${item.name}`}
              onClick={() => setQuantity(item.productId, item.variantId, item.quantity - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-l-lg text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-surface-800"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 10h10" strokeLinecap="round" />
              </svg>
            </button>
            <span className="w-8 text-center text-sm font-medium text-ink-900 dark:text-neutral-100">
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label={`Increase quantity of ${item.name}`}
              disabled={item.quantity >= item.maxQuantity}
              onClick={() => setQuantity(item.productId, item.variantId, item.quantity + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-r-lg text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 dark:text-neutral-300 dark:hover:bg-surface-800 dark:disabled:text-surface-700"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 5v10M5 10h10" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.productId, item.variantId)}
            className="text-xs font-medium text-neutral-500 transition-colors hover:text-error dark:text-neutral-400"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
