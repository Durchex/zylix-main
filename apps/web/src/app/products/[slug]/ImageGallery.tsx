"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/product";

export function ImageGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? null;

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-surface-800 dark:bg-surface-800">
        {active ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative h-full w-full"
            >
              <Image
                src={active.url}
                alt={active.altText ?? productName}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-contain p-8"
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400 dark:text-neutral-500">
            No image available
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={index === activeIndex}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-neutral-50 transition-colors dark:bg-surface-800",
                index === activeIndex ? "border-brand-500 dark:border-accent-400" : "border-transparent hover:border-neutral-300 dark:hover:border-surface-700",
              )}
            >
              <Image src={image.url} alt="" fill className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
