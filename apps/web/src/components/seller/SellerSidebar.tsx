"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Dashboard", href: "/seller" },
  { label: "Products", href: "/seller/products" },
  { label: "Orders", href: "/seller/orders" },
];

export function SellerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white lg:block">
      <div className="flex h-16 items-center border-b border-neutral-200 px-6">
        <Link href="/seller">
          <Logo />
        </Link>
        <span className="ml-2 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
          Seller
        </span>
      </div>
      <nav className="space-y-1 p-4">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block rounded-lg px-2 py-1.5 text-sm font-medium",
                isActive ? "bg-brand-50 text-brand-700" : "text-neutral-700 hover:bg-neutral-50",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
