export function LogoStrip({
  eyebrow,
  title,
  items,
  dense = false,
}: {
  eyebrow: string;
  title: string;
  items: string[];
  dense?: boolean;
}) {
  return (
    <section className="border-t border-neutral-200 py-8 dark:border-surface-800">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-accent-400">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-lg font-bold text-ink-900 dark:text-neutral-50">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {items.map((item) => (
          <span
            key={item}
            className={
              dense
                ? "rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 dark:border-surface-800 dark:bg-surface-900 dark:text-neutral-400"
                : "rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 dark:border-surface-800 dark:bg-surface-900 dark:text-neutral-100"
            }
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
