const FEATURES = [
  {
    title: "Official warranty",
    description: "Every product ships with full manufacturer warranty coverage.",
    icon: (
      <path
        d="M10 2l6 2.5v5c0 4.4-2.6 7.6-6 8.5-3.4-.9-6-4.1-6-8.5v-5L10 2zm-1.3 9.4L6.9 9.6a1 1 0 111.4-1.4l1 1L12.7 6a1 1 0 111.4 1.4l-4.1 4.1a1 1 0 01-1.3-.1z"
        fill="currentColor"
      />
    ),
  },
  {
    title: "Nationwide delivery",
    description: "Fast, tracked shipping to every state across Nigeria.",
    icon: (
      <path
        d="M3 5a1 1 0 011-1h7a1 1 0 011 1v2h1.6a1 1 0 01.8.4l2.6 3.5a1 1 0 01.2.6V15a1 1 0 01-1 1h-1a2 2 0 11-4 0H8a2 2 0 11-4 0H3a1 1 0 01-1-1V5zm12 9a.5.5 0 100 1 .5.5 0 000-1zM6 14a.5.5 0 100 1 .5.5 0 000-1z"
        fill="currentColor"
      />
    ),
  },
  {
    title: "Easy 14-day returns",
    description: "Change your mind? Return unopened items within 14 days.",
    icon: (
      <path
        d="M4 4v4h4M4 8a6 6 0 1010.3-4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
];

export function TrustBadges() {
  return (
    <section className="border-t border-neutral-200 py-8 dark:border-surface-800">
      <div className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => (
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
