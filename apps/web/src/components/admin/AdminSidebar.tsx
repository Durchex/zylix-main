"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

const NAV_SECTIONS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Overview",
    links: [{ label: "Dashboard", href: "/admin" }],
  },
  {
    title: "Catalog",
    links: [
      { label: "Products", href: "/admin/catalog/products" },
      { label: "Bulk Add Products", href: "/admin/catalog/products/bulk" },
      { label: "Categories", href: "/admin/catalog/categories" },
    ],
  },
  {
    title: "Orders",
    links: [{ label: "All Orders", href: "/admin/orders" }],
  },
  {
    title: "Sellers",
    links: [
      { label: "All Sellers", href: "/admin/sellers" },
      { label: "Applications", href: "/admin/sellers/applications" },
    ],
  },
  {
    title: "People",
    links: [{ label: "Users", href: "/admin/users" }],
  },
  {
    title: "Content",
    links: [{ label: "Blog Posts", href: "/admin/cms/blog" }],
  },
  {
    title: "Security",
    links: [{ label: "Audit Log", href: "/admin/audit-log" }],
  },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="space-y-6 p-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            {section.title}
          </p>
          <ul className="mt-2 space-y-1">
            {section.links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onNavigate}
                    className={cn(
                      "block rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-accent-300"
                        : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-surface-800",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar — the sidebar below is lg:block only, so without this
          there is no way at all to navigate between admin sections on a
          narrower viewport. */}
      <div className="flex h-14 items-center gap-3 border-b border-neutral-200 bg-white px-4 dark:border-surface-800 dark:bg-surface-900 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open admin navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-surface-800"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
          </svg>
        </button>
        <Logo />
        <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-surface-800 dark:text-neutral-400">
          Admin
        </span>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-white shadow-elevated dark:bg-surface-900">
            <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4 dark:border-surface-800">
              <Link href="/admin" onClick={() => setMobileOpen(false)}>
                <Logo />
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close admin navigation"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-surface-800"
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white dark:border-surface-800 dark:bg-surface-900 lg:block">
        <div className="flex h-16 items-center border-b border-neutral-200 px-6 dark:border-surface-800">
          <Link href="/admin">
            <Logo />
          </Link>
          <span className="ml-2 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-surface-800 dark:text-neutral-400">
            Admin
          </span>
        </div>
        <NavLinks pathname={pathname} />
      </aside>
    </>
  );
}
