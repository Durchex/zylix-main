import { cn } from "@/lib/utils";

/**
 * Percentage-off pill shown on a discounted product's image.
 *
 * Returns null when there's no genuine discount (no compare-at price, or one
 * that isn't actually higher than what's being charged) so callers can render
 * it unconditionally without guarding first.
 */
export function DiscountBadge({
  price,
  compareAtPrice,
  className,
}: {
  price: number | string;
  compareAtPrice: number | string | null | undefined;
  className?: string;
}) {
  const current = Number(price);
  const original = compareAtPrice === null || compareAtPrice === undefined ? 0 : Number(compareAtPrice);

  if (!Number.isFinite(current) || !Number.isFinite(original) || original <= current) return null;

  const percentOff = Math.round((1 - current / original) * 100);
  if (percentOff <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg bg-brand-600 px-2 py-1 text-xs font-bold text-white shadow-soft",
        className,
      )}
    >
      -{percentOff}%
    </span>
  );
}
