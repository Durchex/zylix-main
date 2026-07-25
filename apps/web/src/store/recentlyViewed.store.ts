import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductSummary } from "@/types/product";

const MAX_ITEMS = 8;

interface RecentlyViewedState {
  products: ProductSummary[];
  add: (product: ProductSummary) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      products: [],
      add: (product) => {
        const rest = get().products.filter((p) => p.id !== product.id);
        set({ products: [product, ...rest].slice(0, MAX_ITEMS) });
      },
    }),
    { name: "zylix-recently-viewed" },
  ),
);
