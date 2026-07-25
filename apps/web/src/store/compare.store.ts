import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_COMPARE_ITEMS = 4;

interface CompareState {
  productIds: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  isFull: () => boolean;
  clear: () => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) =>
        set((state) => {
          if (state.productIds.includes(productId)) {
            return { productIds: state.productIds.filter((id) => id !== productId) };
          }
          if (state.productIds.length >= MAX_COMPARE_ITEMS) {
            return state;
          }
          return { productIds: [...state.productIds, productId] };
        }),
      has: (productId) => get().productIds.includes(productId),
      isFull: () => get().productIds.length >= MAX_COMPARE_ITEMS,
      clear: () => set({ productIds: [] }),
    }),
    { name: "zylix-compare" },
  ),
);
