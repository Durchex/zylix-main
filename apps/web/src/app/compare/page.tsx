"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Rating } from "@/components/ui/Rating";
import { PriceTag } from "@/components/ui/PriceTag";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiRequest } from "@/lib/api-client";
import { useCompareStore } from "@/store/compare.store";
import type { ProductDetail } from "@/types/product";

export default function ComparePage() {
  const productIds = useCompareStore((s) => s.productIds);
  const toggle = useCompareStore((s) => s.toggle);
  const [products, setProducts] = useState<ProductDetail[] | null>(null);

  useEffect(() => {
    if (productIds.length === 0) return;

    let cancelled = false;
    Promise.all(
      productIds.map((id) =>
        apiRequest<{ product: ProductDetail }>(`/products/by-id/${id}`).then((r) => r.product),
      ),
    )
      .then((results) => {
        if (!cancelled) setProducts(results);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [productIds]);

  if (productIds.length === 0 || (products !== null && products.length === 0)) {
    return (
      <Container className="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Nothing to compare yet</h1>
        <p className="mt-2 text-neutral-600">
          Add up to 4 products from the shop to compare their specs side by side.
        </p>
        <Link href="/shop" className="mt-6">
          <Button>Browse products</Button>
        </Link>
      </Container>
    );
  }

  if (products === null) {
    return (
      <Container className="py-10">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">Compare Products</h1>
        <div className="mt-8 flex gap-4">
          {productIds.map((id) => (
            <Skeleton key={id} className="h-64 w-40" />
          ))}
        </div>
      </Container>
    );
  }

  const attributeNames = Array.from(
    new Set((products ?? []).flatMap((p) => p.attributes.map((a) => a.attributeName))),
  );

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">Compare Products</h1>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0">
          <tbody>
            <tr>
              <td className="w-40" />
              {(products ?? []).map((product) => (
                <td key={product.id} className="border-b border-neutral-200 p-4 align-top">
                  <button
                    type="button"
                    onClick={() => toggle(product.id)}
                    className="mb-2 text-xs font-medium text-neutral-400 hover:text-error"
                  >
                    Remove
                  </button>
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-50">
                    {product.primaryImage && (
                      <Image
                        src={product.primaryImage.url}
                        alt={product.name}
                        fill
                        className="object-contain p-4"
                      />
                    )}
                  </div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="mt-2 block text-sm font-medium text-ink-900 hover:text-brand-600"
                  >
                    {product.name}
                  </Link>
                </td>
              ))}
            </tr>
            <tr>
              <td className="border-b border-neutral-200 p-4 text-sm font-medium text-neutral-500">
                Price
              </td>
              {(products ?? []).map((product) => (
                <td key={product.id} className="border-b border-neutral-200 p-4">
                  <PriceTag amount={Number(product.basePrice)} currency={product.currency} />
                </td>
              ))}
            </tr>
            <tr>
              <td className="border-b border-neutral-200 p-4 text-sm font-medium text-neutral-500">
                Rating
              </td>
              {(products ?? []).map((product) => (
                <td key={product.id} className="border-b border-neutral-200 p-4">
                  <Rating value={Number(product.avgRating)} count={product.reviewCount} />
                </td>
              ))}
            </tr>
            {attributeNames.map((attrName) => (
              <tr key={attrName}>
                <td className="border-b border-neutral-200 p-4 text-sm font-medium text-neutral-500">
                  {attrName}
                </td>
                {(products ?? []).map((product) => {
                  const value = product.attributes.find((a) => a.attributeName === attrName)?.value;
                  return (
                    <td key={product.id} className="border-b border-neutral-200 p-4 text-sm text-ink-900">
                      {value ?? "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
