"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";

const FOOTER_COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/shop" },
      { label: "New Arrivals", href: "/new-arrivals" },
      { label: "Deals", href: "/deals" },
      { label: "Brands", href: "/brands" },
    ],
  },
  {
    title: "Customer Service",
    links: [
      { label: "Support Center", href: "/support" },
      { label: "FAQ", href: "/support/faq" },
      { label: "Track Order", href: "/support/order-tracking" },
      { label: "Returns & Refunds", href: "/support/returns" },
      { label: "Contact Us", href: "/support/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Zylix", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Gift Cards", href: "/gift-cards" },
      { label: "Refer & Earn", href: "/referral" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy-policy" },
      { label: "Terms of Service", href: "/legal/terms-of-service" },
      { label: "Shipping Policy", href: "/legal/shipping-policy" },
      { label: "Returns Policy", href: "/legal/returns-policy" },
      { label: "Cookie Policy", href: "/legal/cookie-policy" },
    ],
  },
];

const PAYMENT_BADGES = ["Flutterwave", "Paystack", "Stripe", "PayPal", "Apple Pay", "Google Pay"];

export function Footer() {
  const pathname = usePathname();
  const isDashboardShell = pathname.startsWith("/admin") || pathname.startsWith("/seller");
  if (isDashboardShell) return null;

  return (
    <footer className="border-t-2 border-brand-700 bg-ink-900 text-neutral-400">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Logo tone="light" />
            <p className="mt-3 text-sm">Technology Made Simple.</p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-white">{column.title}</h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-ink-700 pt-8">
          {PAYMENT_BADGES.map((badge) => (
            <span
              key={badge}
              className="rounded-lg border border-ink-700 px-3 py-1 text-xs text-neutral-400"
            >
              {badge}
            </span>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 text-center">
          <p className="text-sm">&copy; {new Date().getFullYear()} Zylix. All rights reserved.</p>
          <p className="text-sm font-medium text-white">Powered by Durchex D.A.M Company LTD</p>
        </div>
      </div>
    </footer>
  );
}
