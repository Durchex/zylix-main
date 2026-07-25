import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

export function PriceTag({
  amount,
  compareAtAmount,
  currency = "NGN",
  className,
}: {
  amount: number;
  compareAtAmount?: number | null;
  currency?: string;
  className?: string;
}) {
  const hasDiscount = typeof compareAtAmount === "number" && compareAtAmount > amount;

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="text-lg font-semibold text-ink-900 dark:text-neutral-50">
        {formatPrice(amount, currency)}
      </span>
      {hasDiscount && (
        <span className="text-sm text-neutral-400 line-through dark:text-neutral-500">
          {formatPrice(compareAtAmount, currency)}
        </span>
      )}
    </div>
  );
}
