"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
import { useCartDrawer } from "@/components/cart/CartDrawerProvider";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { CategorySummary } from "@/types/product";

/**
 * How many top-level categories fit in the desktop nav strip before the rest
 * are only reachable through the "All Categories" dropdown.
 */
const INLINE_CATEGORY_LIMIT = 7;

function useCategories() {
  const [categories, setCategories] = useState<CategorySummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ categories: CategorySummary[] }>("/categories")
      .then((res) => {
        if (!cancelled) setCategories(res.categories);
      })
      // A failed category fetch shouldn't break the header — the nav just
      // renders without the category strip until the next load.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // Only top-level categories belong in the nav; children show up on the
  // category pages themselves.
  return categories.filter((c) => !c.parentId);
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [allCategoriesOpen, setAllCategoriesOpen] = useState(false);
  const allCategoriesRef = useRef<HTMLDivElement>(null);

  const cartCount = useCartStore((s) => s.totalQuantity());
  const wishlistCount = useWishlistStore((s) => s.productIds.length);
  const user = useAuthStore((s) => s.user);
  const openCartDrawer = useCartDrawer();
  const categories = useCategories();

  // Close the dropdown on an outside click — it's a hover/click menu, not a
  // modal, so it shouldn't trap focus or lock scroll the way Dialog does.
  useEffect(() => {
    if (!allCategoriesOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (!allCategoriesRef.current?.contains(event.target as Node)) {
        setAllCategoriesOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [allCategoriesOpen]);

  // Route changes should dismiss any open nav surface.
  useEffect(() => {
    setMobileMenuOpen(false);
    setAllCategoriesOpen(false);
  }, [pathname]);

  const isDashboardShell = pathname.startsWith("/admin");
  if (isDashboardShell) return null;

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  const accountHref = user ? (user.role === "ADMIN" ? "/admin" : "/account") : "/auth/login";
  const inlineCategories = categories.slice(0, INLINE_CATEGORY_LIMIT);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-soft dark:bg-surface-950">
      {/* Row 1 — logo, search, account actions */}
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8">
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-surface-800 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
          </svg>
        </button>

        <Link href="/" className="shrink-0" aria-label="ZylixStore home">
          <Logo />
        </Link>

        <form onSubmit={handleSearchSubmit} className="hidden flex-1 sm:block">
          <div className="flex">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for TVs, refrigerators, audio, kitchen appliances..."
              aria-label="Search products"
              className="h-11 w-full rounded-l-xl border border-r-0 border-neutral-300 bg-white px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            />
            <button
              type="submit"
              aria-label="Submit search"
              className="flex h-11 w-14 shrink-0 items-center justify-center rounded-r-xl bg-brand-600 text-white transition-colors hover:bg-brand-700"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="9" cy="9" r="6" />
                <path d="M17 17l-3.5-3.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {/* Cosmetic today — there's no delivery-area feature behind it yet. */}
          <div className="hidden items-center gap-2 px-2 xl:flex">
            <svg viewBox="0 0 20 20" className="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 2.5c-2.8 0-5 2.2-5 5 0 3.6 5 10 5 10s5-6.4 5-10c0-2.8-2.2-5-5-5z" />
              <circle cx="10" cy="7.5" r="1.8" />
            </svg>
            <span className="leading-tight">
              <span className="block text-[10px] text-neutral-500 dark:text-neutral-400">Deliver to</span>
              <span className="block text-xs font-semibold text-ink-900 dark:text-neutral-100">
                Lagos, Nigeria
              </span>
            </span>
          </div>

          <ThemeToggle />

          <Link
            href={accountHref}
            aria-label={user ? "Your account" : "Log in"}
            title={user ? (user.role === "ADMIN" ? "Admin Dashboard" : user.firstName) : "Log in"}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-900 transition-colors hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-surface-800"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="10" cy="6.5" r="3" />
              <path d="M3.5 17a6.5 6.5 0 0113 0" strokeLinecap="round" />
            </svg>
          </Link>

          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-900 transition-colors hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-surface-800"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 17s-6.5-4-6.5-8.5a3.8 3.8 0 016.5-2.6A3.8 3.8 0 0116.5 8.5C16.5 13 10 17 10 17z" />
            </svg>
            {wishlistCount > 0 && <CountBadge count={wishlistCount} />}
          </Link>

          <button
            type="button"
            onClick={openCartDrawer}
            aria-label={`Open cart (${cartCount} item${cartCount === 1 ? "" : "s"})`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-900 transition-colors hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-surface-800"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path
                d="M3 4h2l1.6 9.6a1.5 1.5 0 001.5 1.4h6.4a1.5 1.5 0 001.5-1.3L17 7H5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="8" cy="17" r="1" />
              <circle cx="14.5" cy="17" r="1" />
            </svg>
            <CountBadge count={cartCount} />
          </button>
        </div>
      </div>

      {/* Row 2 — category nav */}
      <div className="hidden border-t border-neutral-200 dark:border-surface-800 lg:block">
        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <div className="relative" ref={allCategoriesRef}>
            <button
              type="button"
              onClick={() => setAllCategoriesOpen((v) => !v)}
              aria-expanded={allCategoriesOpen}
              className="flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
              </svg>
              All Categories
              <svg
                viewBox="0 0 20 20"
                className={cn("h-4 w-4 transition-transform", allCategoriesOpen && "rotate-180")}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {allCategoriesOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-neutral-200 bg-white py-2 shadow-elevated dark:border-surface-800 dark:bg-surface-900">
                {categories.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-neutral-500">No categories yet.</p>
                ) : (
                  categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/shop/${category.slug}`}
                      className="flex items-center justify-between px-4 py-2.5 text-sm text-ink-900 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-neutral-200 dark:hover:bg-surface-800"
                    >
                      {category.name}
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  ))
                )}
                <Link
                  href="/shop"
                  className="mt-1 block border-t border-neutral-200 px-4 pt-2.5 text-sm font-semibold text-brand-600 dark:border-surface-800 dark:text-accent-400"
                >
                  View all products
                </Link>
              </div>
            )}
          </div>

          <nav className="flex flex-1 items-center gap-1 overflow-x-auto text-sm font-medium">
            <Link
              href="/"
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-surface-800",
                pathname === "/" ? "text-brand-600 dark:text-accent-400" : "text-neutral-700 dark:text-neutral-300",
              )}
            >
              Home
            </Link>
            {inlineCategories.map((category) => (
              <Link
                key={category.id}
                href={`/shop/${category.slug}`}
                className="whitespace-nowrap rounded-lg px-3 py-2 text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-brand-600 dark:text-neutral-300 dark:hover:bg-surface-800"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          <Link
            href="/deals"
            className="flex h-9 shrink-0 items-center rounded-lg bg-deal-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-deal-700"
          >
            Deals
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="border-t border-neutral-200 px-4 py-4 dark:border-surface-800 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="mb-4 sm:hidden">
            <div className="flex">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
                className="h-10 w-full rounded-l-xl border border-r-0 border-neutral-300 bg-white px-3 text-sm dark:border-surface-700 dark:bg-surface-900 dark:text-neutral-100"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="flex h-10 w-12 shrink-0 items-center justify-center rounded-r-xl bg-brand-600 text-white"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="9" cy="9" r="6" />
                  <path d="M17 17l-3.5-3.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </form>

          <ul className="space-y-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            <li>
              <Link href="/" className="block rounded-lg px-3 py-2 hover:bg-neutral-100 dark:hover:bg-surface-800">
                Home
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/shop/${category.slug}`}
                  className="block rounded-lg px-3 py-2 hover:bg-neutral-100 dark:hover:bg-surface-800"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/deals" className="block rounded-lg px-3 py-2 font-semibold text-deal-600">
                Deals
              </Link>
            </li>
            <li className="border-t border-neutral-200 pt-2 dark:border-surface-800">
              <Link href={accountHref} className="block rounded-lg px-3 py-2 hover:bg-neutral-100 dark:hover:bg-surface-800">
                {user ? (user.role === "ADMIN" ? "Admin Dashboard" : "My Account") : "Log in"}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

function CountBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
