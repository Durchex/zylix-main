import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentlyViewedItem {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: string;
  currency: string;
  imageUrl: string | null;
}

const MAX_ITEMS = 12;

interface RecentlyViewedState {
  items: RecentlyViewedItem[];
  record: (item: RecentlyViewedItem) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      record: (item) =>
        set((state) => ({
          items: [item, ...state.items.filter((i) => i.id !== item.id)].slice(0, MAX_ITEMS),
        })),
    }),
    { name: "zylix-recently-viewed" },
  ),
);
