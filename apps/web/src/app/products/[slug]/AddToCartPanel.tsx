"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { PriceTag } from "@/components/ui/PriceTag";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { cn } from "@/lib/utils";
import type { ProductDetail } from "@/types/product";

export function AddToCartPanel({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const wishlisted = useWishlistStore((s) => s.has(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const [variantId, setVariantId] = useState<string | undefined>(defaultVariant?.id);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const activeVariant = product.variants.find((v) => v.id === variantId) ?? defaultVariant;
  const price = activeVariant ? Number(activeVariant.price) : Number(product.basePrice);
  const compareAt = activeVariant?.compareAtPrice
    ? Number(activeVariant.compareAtPrice)
    : product.compareAtPrice
      ? Number(product.compareAtPrice)
      : null;
  // A product with no variants sells directly at basePrice/stockQuantity —
  // only fall back to product-level stock when there's genuinely no variant
  // to read from (not just because none is selected yet).
  const stock = activeVariant ? activeVariant.stockQuantity : product.stockQuantity;
  const inStock = stock > 0;

  function handleAddToCart() {
    addItem({
      productId: product.id,
      variantId: activeVariant?.id ?? null,
      slug: product.slug,
      name: activeVariant ? `${product.name} — ${activeVariant.name}` : product.name,
      imageUrl: product.primaryImage?.url ?? null,
      unitPrice: price,
      currency: product.currency,
      quantity,
      maxQuantity: stock,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch {
        // user cancelled the native share sheet — not an error
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setShareState("copied");
    setTimeout(() => setShareState("idle"), 2000);
  }

  return (
    <div className="space-y-5">
      <PriceTag amount={price} compareAtAmount={compareAt} currency={product.currency} className="text-2xl" />

      <p className={cn("text-sm font-medium", inStock ? "text-success" : "text-error")}>
        {inStock ? `In stock (${stock} available)` : "Out of stock"}
      </p>

      {product.variants.length > 1 && (
        <Select
          label="Variant"
          value={variantId}
          onChange={(e) => {
            setVariantId(e.target.value);
            setQuantity(1);
          }}
        >
          {product.variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.name}
            </option>
          ))}
        </Select>
      )}

      <div className="flex items-center gap-3">
        <label htmlFor="quantity" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Qty
        </label>
        <select
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          disabled={!inStock}
          className="h-10 rounded-xl border border-neutral-300 px-3 text-sm disabled:opacity-50 dark:border-surface-700 dark:bg-surface-900 dark:text-neutral-100"
        >
          {Array.from({ length: Math.min(stock, 10) || 1 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <Button className="relative flex-1 overflow-hidden" disabled={!inStock} onClick={handleAddToCart}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={justAdded ? "added" : "idle"}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="inline-flex items-center gap-1.5"
            >
              {justAdded ? (
                <>
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Added
                </>
              ) : (
                "Add to cart"
              )}
            </motion.span>
          </AnimatePresence>
        </Button>
        <Button
          variant="outline"
          disabled={!inStock}
          onClick={() => {
            handleAddToCart();
            router.push("/cart");
          }}
        >
          Buy now
        </Button>
        <Button
          variant="ghost"
          aria-pressed={wishlisted}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={() => toggleWishlist(product.id)}
        >
          <svg
            viewBox="0 0 20 20"
            className={cn(
              "h-5 w-5",
              wishlisted ? "fill-brand-500 text-brand-500" : "fill-none text-neutral-500 dark:text-neutral-400",
            )}
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M10 17s-6.5-4-6.5-8.5a3.8 3.8 0 016.5-2.6A3.8 3.8 0 0116.5 8.5C16.5 13 10 17 10 17z" />
          </svg>
        </Button>
        <Button
          variant="ghost"
          aria-label="Share this product"
          onClick={handleShare}
        >
          {shareState === "copied" ? (
            <svg viewBox="0 0 20 20" className="h-5 w-5 text-success" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 20 20"
              className="h-5 w-5 text-neutral-500 dark:text-neutral-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="15" cy="5" r="2" />
              <circle cx="5" cy="10" r="2" />
              <circle cx="15" cy="15" r="2" />
              <path d="M6.7 9l6.6-3.2M6.7 11l6.6 3.2" strokeLinecap="round" />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}
