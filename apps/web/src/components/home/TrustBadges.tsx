import type { ReactNode } from "react";

export interface TrustFeature {
  title: string;
  description: string;
  icon: ReactNode;
}

const WARRANTY_ICON = (
  <path
    d="M10 2l6 2.5v5c0 4.4-2.6 7.6-6 8.5-3.4-.9-6-4.1-6-8.5v-5L10 2zm-1.3 9.4L6.9 9.6a1 1 0 111.4-1.4l1 1L12.7 6a1 1 0 111.4 1.4l-4.1 4.1a1 1 0 01-1.3-.1z"
    fill="currentColor"
  />
);

const DELIVERY_ICON = (
  <path
    d="M3 5a1 1 0 011-1h7a1 1 0 011 1v2h1.6a1 1 0 01.8.4l2.6 3.5a1 1 0 01.2.6V15a1 1 0 01-1 1h-1a2 2 0 11-4 0H8a2 2 0 11-4 0H3a1 1 0 01-1-1V5zm12 9a.5.5 0 100 1 .5.5 0 000-1zM6 14a.5.5 0 100 1 .5.5 0 000-1z"
    fill="currentColor"
  />
);

const RETURNS_ICON = (
  <path
    d="M4 4v4h4M4 8a6 6 0 1010.3-4.2"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none"
  />
);

const SECURE_PAYMENT_ICON = (
  <path
    d="M10 2l6 2.5v5c0 4.4-2.6 7.6-6 8.5-3.4-.9-6-4.1-6-8.5v-5L10 2zm0 3.2a2.4 2.4 0 00-1.3 4.4v1.6a1 1 0 002 0v-1.6A2.4 2.4 0 0010 5.2z"
    fill="currentColor"
  />
);

export const DEFAULT_TRUST_FEATURES: TrustFeature[] = [
  {
    title: "Official warranty",
    description: "Every product ships with full manufacturer warranty coverage.",
    icon: WARRANTY_ICON,
  },
  {
    title: "Nationwide delivery",
    description: "Fast, tracked shipping to every state across Nigeria.",
    icon: DELIVERY_ICON,
  },
  {
    title: "Easy 14-day returns",
    description: "Change your mind? Return unopened items within 14 days.",
    icon: RETURNS_ICON,
  },
];

export const AUTHENTICITY_TRUST_FEATURES: TrustFeature[] = [
  {
    title: "100% authentic products",
    description: "Every listing is verified before it goes live — no counterfeits.",
    icon: WARRANTY_ICON,
  },
  {
    title: "Secure payment",
    description: "Card, bank transfer, and wallet payments, all encrypted end-to-end.",
    icon: SECURE_PAYMENT_ICON,
  },
  {
    title: "Free returns within 14 days",
    description: "Change your mind? Return unopened items within 14 days, free.",
    icon: RETURNS_ICON,
  },
];

export function TrustBadges({ features = DEFAULT_TRUST_FEATURES }: { features?: TrustFeature[] }) {
  return (
    <section className="border-t border-neutral-200 py-8 dark:border-surface-800">
      <div className="grid gap-4 sm:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-accent-400">
              <svg viewBox="0 0 20 20" className="h-5 w-5">
                {feature.icon}
              </svg>
            </span>
            <div>
              <h3 className="text-sm font-bold text-ink-900 dark:text-neutral-50">{feature.title}</h3>
              <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
