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

      subtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

      totalQuantity: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "zylix-cart" },
  ),
);
