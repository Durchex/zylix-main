"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { PriceTag } from "@/components/ui/PriceTag";
import { Button } from "@/components/ui/Button";
import { useWishlistStore } from "@/store/wishlist.store";
import { useCompareStore } from "@/store/compare.store";
import { useCartStore } from "@/store/cart.store";
import { cn } from "@/lib/utils";
import type { ProductSummary } from "@/types/product";

export function ProductCard({ product }: { product: ProductSummary }) {
  const router = useRouter();
  const inWishlist = useWishlistStore((s) => s.has(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const inCompare = useCompareStore((s) => s.has(product.id));
  const toggleCompare = useCompareStore((s) => s.toggle);
  const compareFull = useCompareStore((s) => s.isFull());
  const addItem = useCartStore((s) => s.addItem);

  const [justAdded, setJustAdded] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

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
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/cart");
  }

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    const url = `${window.location.origin}/products/${product.slug}`;
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
    setTimeout(() => setShareState("idle"), 1500);
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-colors hover:border-brand-400 dark:border-surface-800 dark:bg-surface-900 dark:hover:border-brand-600">
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={inWishlist}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-soft hover:bg-white dark:bg-surface-800/90 dark:text-neutral-100 dark:hover:bg-surface-800"
        >
          <svg
            viewBox="0 0 20 20"
            className={cn("h-4 w-4", inWishlist ? "fill-brand-500 text-brand-500" : "fill-none text-neutral-500 dark:text-neutral-400")}
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M10 17s-6.5-4-6.5-8.5a3.8 3.8 0 016.5-2.6A3.8 3.8 0 0116.5 8.5C16.5 13 10 17 10 17z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleShare}
          aria-label="Share this product"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-soft hover:bg-white dark:bg-surface-800/90 dark:text-neutral-100 dark:hover:bg-surface-800"
        >
          {shareState === "copied" ? (
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-success" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4 text-neutral-500 dark:text-neutral-400"
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
        </button>
      </div>

      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-neutral-50 dark:bg-surface-800">
          {product.primaryImage ? (
            <Image
              src={product.primaryImage.url}
              alt={product.primaryImage.altText ?? product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-contain p-4"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400 dark:text-neutral-500">
              No image
            </div>
          )}
          {product.isFeatured && (
            <Badge variant="brand" className="absolute left-3 top-3">
              Featured
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          {product.brand}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-medium text-ink-900 hover:text-brand-600 dark:text-neutral-100 dark:hover:text-accent-400">
            {product.name}
          </h3>
        </Link>
        <Rating value={Number(product.avgRating)} count={product.reviewCount} className="mt-0.5" />
        <PriceTag
          amount={Number(product.basePrice)}
          compareAtAmount={product.compareAtPrice ? Number(product.compareAtPrice) : null}
          currency={product.currency}
          className="mt-1"
        />

        <div className="mt-2 flex gap-2">
          <Button size="sm" className="flex-1" disabled={!inStock} onClick={handleAddToCart}>
            {justAdded ? "Added" : "Add to cart"}
          </Button>
          <Button size="sm" variant="outline" disabled={!inStock} onClick={handleBuyNow}>
            Buy now
          </Button>
        </div>

        <button
          type="button"
          onClick={() => toggleCompare(product.id)}
          disabled={!inCompare && compareFull}
          className={cn(
            "mt-2 self-start text-xs font-medium underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-neutral-300 disabled:no-underline dark:disabled:text-surface-700",
            inCompare ? "text-brand-600 dark:text-accent-400" : "text-neutral-500 dark:text-neutral-400",
          )}
        >
          {inCompare ? "Remove from compare" : "Add to compare"}
        </button>
      </div>
    </div>
  );
}
