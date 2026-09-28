"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { useCartStore } from "@/store/cart.store";
import type { PaginatedResult, ProductSummary } from "@/types/product";

export interface CartChange {
  name: string;
  kind: "price" | "removed";
  from?: number;
  to?: number;
}

/**
 * Reconciles the cart with the catalogue once when a page mounts, and reports
 * what changed.
 *
 * The cart remembers each item's price from the moment it was added, but the
 * order is always charged at the current database price. Without this, a
 * customer whose cart pre-dates a price change sees one total through the whole
 * flow and is charged a different one — the price appears to move under them.
 * The server is the only authority on price, so the client asks it rather than
 * trusting what it stored.
 *
 * Failing to reach the catalogue leaves the cart untouched: showing stale
 * numbers is better than emptying someone's cart over a network blip, and the
 * server still charges the true price regardless.
 */
export function useCartPriceSync(): { changes: CartChange[]; synced: boolean } {
  const [changes, setChanges] = useState<CartChange[]>([]);
  const [synced, setSynced] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const { items, syncWithCatalog } = useCartStore.getState();
    const lines = items.filter((i) => !i.variantId);
    if (lines.length === 0) {
      // Deferred so mounting with an empty cart doesn't set state synchronously.
      queueMicrotask(() => setSynced(true));
      return;
    }

    const ids = [...new Set(lines.map((i) => i.productId))];

    apiRequest<PaginatedResult<ProductSummary>>(
      `/products?ids=${ids.join(",")}&pageSize=${Math.min(ids.length, 100)}`,
    )
      .then((res) => {
        const current = res.items.map((p) => ({
          productId: p.id,
          unitPrice: Number(p.basePrice),
          maxQuantity: p.stockQuantity,
        }));
        const found = new Set(current.map((c) => c.productId));
        const unavailable = ids.filter((id) => !found.has(id));

        const detected: CartChange[] = [];
        for (const line of lines) {
          if (unavailable.includes(line.productId)) {
            detected.push({ name: line.name, kind: "removed" });
            continue;
          }
          const fresh = current.find((c) => c.productId === line.productId);
          if (fresh && fresh.unitPrice !== line.unitPrice) {
            detected.push({ name: line.name, kind: "price", from: line.unitPrice, to: fresh.unitPrice });
          }
        }

        syncWithCatalog(current, unavailable);
        setChanges(detected);
      })
      .catch(() => undefined)
      .finally(() => setSynced(true));
  }, []);

  return { changes, synced };
}
