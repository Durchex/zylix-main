"use client";

import { useEffect } from "react";
import { useRecentlyViewedStore, type RecentlyViewedItem } from "@/store/recentlyViewed.store";

// Invisible — a Server Component (the product detail page) can't call a
// Zustand hook itself, so this tiny client leaf records the view on mount
// without making the whole page a client component.
export function RecentlyViewedTracker({ item }: { item: RecentlyViewedItem }) {
  const record = useRecentlyViewedStore((s) => s.record);

  useEffect(() => {
    record(item);
    // Only needs to fire once per page load — `item` is derived fresh each
    // render from server data that doesn't change client-side.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
