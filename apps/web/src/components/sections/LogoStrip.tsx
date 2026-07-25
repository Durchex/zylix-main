export function LogoStrip({ title, logos }: { title: string; logos: string[] }) {
  return (
    <section className="border-t border-neutral-200 py-8 dark:border-surface-800">
      <h2 className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {title}
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {logos.map((logo) => (
          <span
            key={logo}
            className="text-sm font-bold uppercase tracking-wide text-neutral-400 dark:text-neutral-600"
          >
            {logo}
          </span>
        ))}
      </div>
    </section>
  );
}
