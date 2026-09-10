"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_TEL_HREF, whatsAppHref } from "@/lib/contact";

/**
 * The navy strip above the header. Hidden on /admin, which has its own
 * dashboard chrome — same rule Header and Footer already follow.
 */
export function AnnouncementBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="bg-secondary-950 text-white">
      <div className="mx-auto flex h-10 w-full max-w-[1600px] items-center justify-between gap-4 px-4 text-xs sm:px-6 lg:px-8">
        <p className="flex items-center gap-2 font-medium">
          <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 6h9v8H2zM11 8h4l3 3v3h-7z" strokeLinejoin="round" />
            <circle cx="5.5" cy="16" r="1.5" />
            <circle cx="14.5" cy="16" r="1.5" />
          </svg>
          <span className="hidden sm:inline">Free Shipping on All Orders Above ₦50,000</span>
          <span className="sm:hidden">Free shipping over ₦50,000</span>
        </p>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/support/order-tracking"
            className="hidden items-center gap-1.5 transition-opacity hover:opacity-80 sm:flex"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 2.5c-2.8 0-5 2.2-5 5 0 3.6 5 10 5 10s5-6.4 5-10c0-2.8-2.2-5-5-5z" />
              <circle cx="10" cy="7.5" r="1.8" />
            </svg>
            Track Your Order
          </Link>
          <a
            href={whatsAppHref()}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Chat with us on WhatsApp"
            className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.700-1.7-.8-.2-.1-.4-.1-.6.1s-.6.8-.8 1-.3.2-.6.1a6.7 6.7 0 01-3.3-2.9c-.2-.4.2-.4.6-1.2.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3A3 3 0 006 10a5.2 5.2 0 001.1 2.7 11.9 11.9 0 004.6 4 5.3 5.3 0 002.4.5 2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.2-1.3c-.1-.1-.3-.2-.6-.3z" />
            </svg>
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <a
            href={SUPPORT_TEL_HREF}
            className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 3h3l1.5 4-2 1.5a11 11 0 005 5L13 11.5 17 13v3a1 1 0 01-1.1 1A14 14 0 013 4.1 1 1 0 014 3z" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Support: </span>
            {SUPPORT_PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </div>
  );
}
