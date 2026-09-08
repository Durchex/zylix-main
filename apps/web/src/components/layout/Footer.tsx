"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";

const FOOTER_COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Quick Links",
    links: [
      { label: "Home", href: "/" },
      { label: "All Products", href: "/shop" },
      { label: "Deals", href: "/deals" },
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/support/contact" },
    ],
  },
  {
    title: "Customer Service",
    links: [
      { label: "Track Your Order", href: "/support/order-tracking" },
      { label: "Shipping Policy", href: "/legal/shipping-policy" },
      { label: "Returns & Refunds", href: "/support/returns" },
      { label: "Warranty", href: "/legal/returns-policy" },
      { label: "FAQs", href: "/support/faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "My Account", href: "/account" },
      { label: "Orders", href: "/account/orders" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Addresses", href: "/account/addresses" },
      { label: "Login / Register", href: "/auth/login" },
    ],
  },
];

const PAYMENT_BADGES = ["VISA", "Mastercard", "Verve", "PayPal"];

const SOCIAL_LINKS: Array<{ label: string; href: string; icon: React.ReactNode }> = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: <path d="M13 7h2V4h-2a4 4 0 00-4 4v2H7v3h2v7h3v-7h2.2l.8-3H12V8a1 1 0 011-1z" />,
  },
  {
    label: "X",
    href: "https://x.com",
    icon: <path d="M4 4l7.5 9.3L4.4 20h2l5.7-5.4L16.5 20H20l-7.8-9.7L19.5 4h-2l-5.2 4.9L8 4z" />,
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: (
      <>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17" cy="7" r="1.2" />
      </>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    icon: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10.5 9.5l4.5 2.5-4.5 2.5z" />
      </>
    ),
  },
  {
    label: "TikTok",
    href: "https://tiktok.com",
    icon: (
      <path d="M14 3h2.5a5 5 0 004.5 4v2.6a7.5 7.5 0 01-4.5-1.5V15a5.5 5.5 0 11-5.5-5.5c.3 0 .7 0 1 .1v2.7a2.8 2.8 0 101.9 2.6z" />
    ),
  },
];

export function Footer() {
  const pathname = usePathname();
  const isDashboardShell = pathname.startsWith("/admin");
  if (isDashboardShell) return null;

  return (
    <footer className="bg-secondary-950 text-neutral-400">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo tone="light" />
            <p className="mt-4 max-w-xs text-sm">
              Your trusted electronics store in Nigeria. Genuine products. Great prices. Fast
              delivery.
            </p>
            <div className="mt-5 flex gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand-600"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    {social.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-white">{column.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} ZylixStore. All rights reserved.{" "}
            <span className="text-white">Powered by Durchex D.A.M Company LTD</span>
          </p>

          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide">We Accept</span>
            <div className="flex gap-1.5">
              {PAYMENT_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="rounded bg-white px-2 py-1 text-[10px] font-bold text-secondary-950"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
