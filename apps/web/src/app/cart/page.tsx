"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());

  if (items.length === 0) {
    return (
      <Container className="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Your cart is empty</h1>
        <p className="mt-2 text-neutral-600">Browse the catalog and add something you love.</p>
        <Link href="/shop" className="mt-6">
          <Button>Start shopping</Button>
        </Link>
      </Container>
    );
  }

  const currency = items[0]?.currency ?? "NGN";

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">Your Cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <Card key={`${item.productId}:${item.variantId ?? "default"}`}>
              <CardBody className="flex gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-50">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-2" />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      href={`/products/${item.slug}`}
                      className="text-sm font-medium text-ink-900 hover:text-brand-600"
                    >
                      {item.name}
                    </Link>
                    <p className="whitespace-nowrap text-sm font-semibold text-ink-900">
                      {formatPrice(item.unitPrice * item.quantity, item.currency)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <select
                      aria-label={`Quantity for ${item.name}`}
                      value={item.quantity}
                      onChange={(e) =>
                        setQuantity(item.productId, item.variantId, Number(e.target.value))
                      }
                      className="h-9 rounded-lg border border-neutral-300 px-2 text-sm"
                    >
                      {Array.from({ length: Math.max(item.maxQuantity, item.quantity) }, (_, i) => i + 1).map(
                        (n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ),
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="text-sm font-medium text-error hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card className="h-fit">
          <CardBody className="space-y-4">
            <h2 className="font-semibold text-ink-900">Order Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Subtotal</span>
              <span className="text-ink-900">{formatPrice(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Shipping</span>
              <span className="text-neutral-500">Calculated at checkout</span>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-4 text-base font-semibold">
              <span className="text-ink-900">Total</span>
              <span className="text-ink-900">{formatPrice(subtotal, currency)}</span>
            </div>
            <Button className="w-full" onClick={() => router.push("/checkout")}>
              Proceed to checkout
            </Button>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
