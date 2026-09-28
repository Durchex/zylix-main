"use client";

import { AuthGuard } from "@/components/providers/AuthGuard";

/**
 * Checkout needs a signed-in customer: the order endpoint requires one, and
 * so do saved addresses. It used to be open to guests, who could fill in an
 * address, pick a courier and choose how to pay — and only then hit an
 * authentication error on the very last click. Guarding the whole flow sends
 * them to sign in first, with the cart kept (it lives in local storage) and
 * a `next` redirect back here afterwards.
 */
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
