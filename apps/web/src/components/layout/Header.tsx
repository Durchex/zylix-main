"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/layout/Logo";
import { Container } from "@/components/ui/Container";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";

const CATEGORY_LINKS = [
  { label: "Smartphones", href: "/shop/smartphones" },
  { label: "Laptops", href: "/shop/laptops" },
  { label: "Gaming", href: "/shop/gaming" },
  { label: "Smartwatches", href: "/shop/smartwatches" },
  { label: "Accessories", href: "/shop/accessories" },
  { label: "Home Electronics", href: "/shop/home-electronics" },
];

function IconButton({
  href,
  label,
  count,
  children,
}: {
  href: string;
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-surface-800"
    >
      {children}
      {Boolean(count) && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = useCartStore((s) => s.totalQuantity());
  const wishlistCount = useWishlistStore((s) => s.productIds.length);
  const user = useAuthStore((s) => s.user);

  const isDashboardShell = pathname.startsWith("/admin") || pathname.startsWith("/seller");
  if (isDashboardShell) return null;

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white dark:border-surface-800 dark:bg-surface-950">
      <Container className="flex h-16 items-center gap-4">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-surface-800 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
          </svg>
        </button>

        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-neutral-700 dark:text-neutral-300 lg:flex">
          {CATEGORY_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink-900 dark:hover:text-white">
              {link.label}
            </Link>
          ))}
          <Link href="/deals" className="text-brand-600 hover:text-brand-700 dark:text-accent-400 dark:hover:text-accent-300">
            Deals
          </Link>
        </nav>

        <form onSubmit={handleSearchSubmit} className="ml-auto hidden max-w-xl flex-1 sm:block">
          <div className="flex">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands, and categories..."
              aria-label="Search products"
              className="h-10 w-full rounded-l border border-r-0 border-neutral-300 bg-white pl-3 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            />
            <button
              type="submit"
              aria-label="Submit search"
              className="flex h-10 w-11 shrink-0 items-center justify-center rounded-r border border-brand-700 bg-brand-600 text-white hover:bg-brand-700"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="9" r="6" />
                <path d="M17 17l-3.5-3.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <ThemeToggle />
          <IconButton href="/wishlist" label="Wishlist" count={wishlistCount}>
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 17s-6.5-4-6.5-8.5a3.8 3.8 0 016.5-2.6A3.8 3.8 0 0116.5 8.5C16.5 13 10 17 10 17z" />
            </svg>
          </IconButton>
          <IconButton href="/cart" label="Cart" count={cartCount}>
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 4h2l1.6 9.6a1.5 1.5 0 001.5 1.4h6.4a1.5 1.5 0 001.5-1.3L17 7H5.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="8" cy="17" r="1" />
              <circle cx="14.5" cy="17" r="1" />
            </svg>
          </IconButton>
          <Link
            href={user ? "/account" : "/auth/login"}
            className="ml-1 hidden rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-ink-900 hover:bg-neutral-50 dark:border-surface-700 dark:text-neutral-100 dark:hover:bg-surface-800 sm:block"
          >
            {user ? user.firstName : "Log in"}
          </Link>
        </div>
      </Container>

      {mobileMenuOpen && (
        <nav className="border-t border-neutral-200 px-6 py-4 dark:border-surface-800 lg:hidden">
          <ul className="space-y-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {CATEGORY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={() => setMobileMenuOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/deals" onClick={() => setMobileMenuOpen(false)} className="text-brand-600 dark:text-accent-400">
                Deals
              </Link>
            </li>
            <li>
              <Link href={user ? "/account" : "/auth/login"} onClick={() => setMobileMenuOpen(false)}>
                {user ? "My Account" : "Log in"}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
