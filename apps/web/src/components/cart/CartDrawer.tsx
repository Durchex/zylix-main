"use client";

import Link from "next/link";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const totalQuantity = useCartStore((s) => s.totalQuantity());
  const currency = items[0]?.currency ?? "NGN";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={totalQuantity > 0 ? `Your Cart (${totalQuantity})` : "Your Cart"}
      footer={
        items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Subtotal</span>
              <span className="text-base font-bold text-ink-900 dark:text-neutral-100">
                {formatPrice(subtotal, currency)}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Shipping is calculated at checkout.
            </p>
            <Link href="/checkout" onClick={onClose} className="block">
              <Button className="w-full">Checkout</Button>
            </Link>
            <Link href="/cart" onClick={onClose} className="block">
              <Button variant="outline" className="w-full">
                View full cart
              </Button>
            </Link>
          </div>
        ) : null
      }
    >
      {items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-surface-800">
            <svg
              viewBox="0 0 20 20"
              className="h-6 w-6 text-neutral-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M3 4h2l1.6 9.6a1.5 1.5 0 001.5 1.4h6.4a1.5 1.5 0 001.5-1.3L17 7H5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="8" cy="17" r="1" />
              <circle cx="14.5" cy="17" r="1" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-ink-900 dark:text-neutral-100">Your cart is empty</p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Browse the catalog and add something you love.
            </p>
          </div>
          <Link href="/shop" onClick={onClose}>
            <Button>Start shopping</Button>
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200 dark:divide-surface-800">
          {items.map((item) => (
            <li key={`${item.productId}:${item.variantId ?? "default"}`} className="px-5 py-4">
              <CartItemRow item={item} compact onNavigate={onClose} />
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
