"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Overview", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Addresses", href: "/account/addresses" },
  { label: "Wallet & Rewards", href: "/account/wallet" },
  { label: "Security", href: "/account/security" },
];

function isLinkActive(pathname: string, href: string) {
  return href === "/account" ? pathname === href : pathname.startsWith(href);
}

export function AccountSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-neutral-200 px-6">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        {user && (
          <div className="flex items-center gap-3 border-b border-neutral-200 px-6 py-5">
            <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-neutral-500">{user.email}</p>
            </div>
          </div>
        )}
        <nav className="space-y-1 p-4">
          {NAV_LINKS.map((link) => {
            const isActive = isLinkActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium",
                  isActive ? "bg-brand-50 text-brand-700" : "text-neutral-700 hover:bg-neutral-50",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="flex gap-2 overflow-x-auto border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
        {NAV_LINKS.map((link) => {
          const isActive = isLinkActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium",
                isActive ? "bg-brand-50 text-brand-700" : "text-neutral-600 hover:bg-neutral-50",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
