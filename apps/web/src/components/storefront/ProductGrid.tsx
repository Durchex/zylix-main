import { ProductCard } from "@/components/storefront/ProductCard";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ProductSummary } from "@/types/product";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function ProductGridEmpty({ message = "No products found." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 py-16 text-center dark:border-surface-700">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-surface-800 dark:text-neutral-500">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            d="M3 7l1.5-3h15L21 7M3 7v12a1 1 0 001 1h16a1 1 0 001-1V7M3 7h18M9 11a3 3 0 006 0"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="mt-4 text-neutral-500 dark:text-neutral-400">{message}</p>
    </div>
  );
}

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) {
    return <ProductGridEmpty />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
