"use client";

import { Alert } from "@/components/ui/Alert";
import { formatPrice } from "@/lib/utils";
import type { CartChange } from "@/lib/use-cart-price-sync";

/**
 * Tells the customer when their cart no longer matches the catalogue.
 * Shown once, at the top of the step, so a changed total is explained where it
 * happens instead of being noticed later as a discrepancy.
 */
export function CartChangeNotice({ changes }: { changes: CartChange[] }) {
  if (changes.length === 0) return null;

  return (
    <Alert variant="warning" className="mb-6">
      <p className="font-semibold">Some items in your cart have been updated</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
        {changes.map((change) => (
          <li key={`${change.kind}-${change.name}`}>
            {change.kind === "removed" ? (
              <>
                <span className="font-medium">{change.name}</span> is no longer available and was
                removed.
              </>
            ) : (
              <>
                <span className="font-medium">{change.name}</span> is now{" "}
                {formatPrice(change.to ?? 0)} (was {formatPrice(change.from ?? 0)}).
              </>
            )}
          </li>
        ))}
      </ul>
    </Alert>
  );
}
