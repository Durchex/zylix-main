"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";

interface CartDrawerContextValue {
  open: () => void;
  close: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

/**
 * Opens the cart quick-view. Safe to call from anywhere — components
 * rendered outside the provider (unit tests, isolated stories) get a no-op
 * rather than a thrown error, since failing to open a convenience drawer
 * shouldn't break the page it's on.
 */
export function useCartDrawer(): () => void {
  const ctx = useContext(CartDrawerContext);
  return ctx?.open ?? (() => undefined);
}

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
      <CartDrawer open={isOpen} onClose={close} />
    </CartDrawerContext.Provider>
  );
}
