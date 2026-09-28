import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLineItem } from "@/types/cart";

function lineKey(productId: string, variantId: string | null) {
  return `${productId}:${variantId ?? "default"}`;
}

interface CartState {
  items: CartLineItem[];
  addItem: (item: CartLineItem) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  setQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clear: () => void;
  /**
   * Replaces stored prices/stock limits with the server's current ones, and
   * drops lines the catalogue no longer sells. A cart is a snapshot taken when
   * an item was added; without reconciling, every later step shows that stale
   * number while the order is charged at today's price.
   */
  syncWithCatalog: (
    current: Array<{ productId: string; unitPrice: number; maxQuantity: number }>,
    unavailableProductIds: string[],
  ) => void;
  subtotal: () => number;
  totalQuantity: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const key = lineKey(item.productId, item.variantId);
          const existing = state.items.find(
            (i) => lineKey(i.productId, i.variantId) === key,
          );

          if (existing) {
            const nextQuantity = Math.min(
              existing.quantity + item.quantity,
              existing.maxQuantity,
            );
            return {
              items: state.items.map((i) =>
                lineKey(i.productId, i.variantId) === key
                  ? { ...i, quantity: nextQuantity }
                  : i,
              ),
            };
          }

          return { items: [...state.items, item] };
        }),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => lineKey(i.productId, i.variantId) !== lineKey(productId, variantId),
          ),
        })),

      setQuantity: (productId, variantId, quantity) =>
        set((state) => {
          const key = lineKey(productId, variantId);
          if (quantity <= 0) {
            return { items: state.items.filter((i) => lineKey(i.productId, i.variantId) !== key) };
          }
          return {
            items: state.items.map((i) =>
              lineKey(i.productId, i.variantId) === key
                ? { ...i, quantity: Math.min(quantity, i.maxQuantity) }
                : i,
            ),
          };
        }),

      clear: () => set({ items: [] }),

      syncWithCatalog: (current, unavailableProductIds) =>
        set((state) => {
          const byProduct = new Map(current.map((c) => [c.productId, c]));
          const gone = new Set(unavailableProductIds);
          return {
            items: state.items
              .filter((i) => !gone.has(i.productId))
              .map((i) => {
                const fresh = i.variantId ? undefined : byProduct.get(i.productId);
                if (!fresh) return i;
                return {
                  ...i,
                  unitPrice: fresh.unitPrice,
                  maxQuantity: fresh.maxQuantity,
                  // A line can't hold more than is now in stock.
                  quantity: Math.min(i.quantity, Math.max(fresh.maxQuantity, 1)),
                };
              }),
          };
        }),

      subtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

      totalQuantity: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "zylix-cart" },
  ),
);
