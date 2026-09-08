"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Rating } from "@/components/ui/Rating";
import { PriceTag } from "@/components/ui/PriceTag";
import { Button } from "@/components/ui/Button";
import { DiscountBadge } from "@/components/storefront/DiscountBadge";
import { useWishlistStore } from "@/store/wishlist.store";
import { useCompareStore } from "@/store/compare.store";
import { useCartStore } from "@/store/cart.store";
import { useCartDrawer } from "@/components/cart/CartDrawerProvider";
import { cn } from "@/lib/utils";
import type { ProductSummary } from "@/types/product";

export function ProductCard({ product }: { product: ProductSummary }) {
  const inWishlist = useWishlistStore((s) => s.has(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const inCompare = useCompareStore((s) => s.has(product.id));
  const toggleCompare = useCompareStore((s) => s.toggle);
  const compareFull = useCompareStore((s) => s.isFull());
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartDrawer();

  const [justAdded, setJustAdded] = useState(false);

  const price = product.defaultVariant ? Number(product.defaultVariant.price) : Number(product.basePrice);
  const stock = product.defaultVariant ? product.defaultVariant.stockQuantity : product.stockQuantity;
  const inStock = stock > 0;

  function handleAddToCart() {
    addItem({
      productId: product.id,
      variantId: product.defaultVariant?.id ?? null,
      slug: product.slug,
      name: product.name,
      imageUrl: product.primaryImage?.url ?? null,
      unitPrice: price,
      currency: product.currency,
      quantity: 1,
      maxQuantity: stock,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
    // Opening the drawer is the confirmation that something was added —
    // it shows the item landing in the cart rather than just flashing a
    // label on the button the user may not be looking at.
    openCart();
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-elevated dark:border-surface-800 dark:bg-surface-900 dark:hover:border-brand-600">
      <div className="absolute left-3 top-3 z-10">
        <DiscountBadge price={product.basePrice} compareAtPrice={product.compareAtPrice} />
      </div>

      <button
        type="button"
        onClick={() => toggleWishlist(product.id)}
        aria-pressed={inWishlist}
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-soft transition-colors hover:bg-white dark:bg-surface-800/90 dark:text-neutral-100"
      >
        <svg
          viewBox="0 0 20 20"
          className={cn(
            "h-4 w-4 transition-colors",
            inWishlist ? "fill-deal-500 text-deal-500" : "fill-none text-neutral-500 dark:text-neutral-400",
          )}
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M10 17s-6.5-4-6.5-8.5a3.8 3.8 0 016.5-2.6A3.8 3.8 0 0116.5 8.5C16.5 13 10 17 10 17z" />
        </svg>
      </button>

      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-white dark:bg-surface-800">
          {product.primaryImage ? (
            <Image
              src={product.primaryImage.url}
              alt={product.primaryImage.altText ?? product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400 dark:text-neutral-500">
              No image
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4 pt-3">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-ink-900 transition-colors hover:text-brand-600 dark:text-neutral-100 dark:hover:text-accent-400">
            {product.name}
          </h3>
        </Link>

        <Rating value={Number(product.avgRating)} count={product.reviewCount} />

        <PriceTag
          amount={Number(product.basePrice)}
          compareAtAmount={product.compareAtPrice ? Number(product.compareAtPrice) : null}
          currency={product.currency}
        />

        <Button
          size="sm"
          className="mt-auto w-full"
          disabled={!inStock}
          onClick={handleAddToCart}
          aria-label={`Add ${product.name} to cart`}
        >
          {justAdded ? (
            "Added"
          ) : (
            <>
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path
                  d="M3 4h2l1.6 9.6a1.5 1.5 0 001.5 1.4h6.4a1.5 1.5 0 001.5-1.3L17 7H5.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="8" cy="17" r="1" />
                <circle cx="14.5" cy="17" r="1" />
              </svg>
              {inStock ? "Add to Cart" : "Out of stock"}
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={() => toggleCompare(product.id)}
          disabled={!inCompare && compareFull}
          className={cn(
            "self-start text-xs font-medium underline-offset-2 transition-colors hover:underline disabled:cursor-not-allowed disabled:text-neutral-300 disabled:no-underline dark:disabled:text-surface-700",
            inCompare ? "text-brand-600 dark:text-accent-400" : "text-neutral-500 dark:text-neutral-400",
          )}
        >
          {inCompare ? "Remove from compare" : "Compare"}
        </button>
      </div>
    </div>
  );
}
