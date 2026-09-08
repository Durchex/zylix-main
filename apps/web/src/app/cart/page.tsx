"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const totalQuantity = useCartStore((s) => s.totalQuantity());

  if (items.length === 0) {
    return (
      <Container className="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-surface-800">
          <svg viewBox="0 0 20 20" className="h-7 w-7 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path
              d="M3 4h2l1.6 9.6a1.5 1.5 0 001.5 1.4h6.4a1.5 1.5 0 001.5-1.3L17 7H5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="8" cy="17" r="1" />
            <circle cx="14.5" cy="17" r="1" />
          </svg>
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">
          Your cart is empty
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Browse the catalog and add something you love.
        </p>
        <Link href="/shop" className="mt-6">
          <Button size="lg">Start shopping</Button>
        </Link>
      </Container>
    );
  }

  const currency = items[0]?.currency ?? "NGN";

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">Your Cart</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        {totalQuantity} item{totalQuantity === 1 ? "" : "s"} in your cart
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <Card key={`${item.productId}:${item.variantId ?? "default"}`}>
              <CardBody>
                <CartItemRow item={item} />
              </CardBody>
            </Card>
          ))}
        </div>

        <Card className="h-fit lg:sticky lg:top-40">
          <CardBody className="space-y-4">
            <h2 className="font-semibold text-ink-900 dark:text-neutral-100">Order Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Subtotal</span>
              <span className="text-ink-900 dark:text-neutral-100">{formatPrice(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Shipping</span>
              <span className="text-neutral-500 dark:text-neutral-400">Calculated at checkout</span>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-4 text-base font-semibold dark:border-surface-800">
              <span className="text-ink-900 dark:text-neutral-100">Total</span>
              <span className="text-ink-900 dark:text-neutral-100">{formatPrice(subtotal, currency)}</span>
            </div>
            <Button className="w-full" size="lg" onClick={() => router.push("/checkout")}>
              Proceed to checkout
            </Button>
            <Link href="/shop" className="block text-center text-sm font-medium text-brand-600 hover:underline dark:text-accent-400">
              Continue shopping
            </Link>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
