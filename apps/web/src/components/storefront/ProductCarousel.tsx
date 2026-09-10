"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { cn } from "@/lib/utils";
import type { ProductSummary } from "@/types/product";

/**
 * Horizontally scrolling product row.
 *
 * Built on native scroll with snap points rather than a transform-driven
 * carousel: it keeps touch/trackpad swiping, keyboard scrolling and
 * scrollbar dragging working for free, and degrades to a plain scrollable
 * row if JavaScript hasn't hydrated yet. The arrows just drive scrollBy.
 */
export function ProductCarousel({ products }: { products: ProductSummary[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const syncArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    // A pixel of slack — sub-pixel widths mean the two sides rarely land
    // exactly equal at the end of a scroll.
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    syncArrows();
    el.addEventListener("scroll", syncArrows, { passive: true });

    // Arrow visibility depends on the track's width, which changes on resize
    // and when the card grid reflows.
    const observer = new ResizeObserver(syncArrows);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", syncArrows);
      observer.disconnect();
    };
  }, [syncArrows, products.length]);

  function scrollByPage(direction: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    // Roughly one screenful, so a click always advances past whole cards.
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%] xl:w-[19%]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <CarouselArrow side="left" visible={canScrollLeft} onClick={() => scrollByPage(-1)} />
      <CarouselArrow side="right" visible={canScrollRight} onClick={() => scrollByPage(1)} />
    </div>
  );
}

function CarouselArrow({
  side,
  visible,
  onClick,
}: {
  side: "left" | "right";
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      // Hidden from assistive tech and the tab order: the track itself is
      // scrollable and focusable, so these are a pointer convenience rather
      // than the only way through the row.
      aria-hidden="true"
      tabIndex={-1}
      className={cn(
        "absolute top-[38%] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-ink-900 shadow-elevated transition-opacity hover:bg-neutral-50 sm:flex dark:border-surface-700 dark:bg-surface-900 dark:text-neutral-100",
        side === "left" ? "-left-4" : "-right-4",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d={side === "left" ? "M12 5l-5 5 5 5" : "M8 5l5 5-5 5"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
