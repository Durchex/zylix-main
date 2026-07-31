const STEPS = [
  {
    step: "1",
    title: "Browse electronics",
    description: "Search and filter across smartphones, laptops, gaming gear, and home appliances.",
  },
  {
    step: "2",
    title: "Place your order",
    description: "Checkout securely with card, bank transfer, or wallet — no surprises at payment.",
  },
  {
    step: "3",
    title: "Enjoy fast delivery",
    description: "Track your order from dispatch to doorstep, anywhere in Nigeria.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="border-t border-neutral-200 py-10 dark:border-surface-800">
      <h2 className="text-xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">How it works</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        {STEPS.map((item) => (
          <div key={item.step} className="relative rounded-2xl border border-neutral-200 p-6 dark:border-surface-800">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
              {item.step}
            </span>
            <h3 className="mt-4 text-sm font-bold text-ink-900 dark:text-neutral-50">{item.title}</h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
