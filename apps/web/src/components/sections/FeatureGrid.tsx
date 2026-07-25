export interface FeatureItem {
  title: string;
  description: string;
}

export function FeatureGrid({
  title,
  items,
  numbered = false,
}: {
  title?: string;
  items: FeatureItem[];
  numbered?: boolean;
}) {
  return (
    <section className="border-t border-neutral-200 py-8 dark:border-surface-800">
      {title && (
        <h2 className="mb-4 text-lg font-bold text-ink-900 dark:text-neutral-50">{title}</h2>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={item.title}
            className="rounded-2xl border border-neutral-200 p-5 dark:border-surface-800"
          >
            {numbered ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {index + 1}
              </span>
            ) : null}
            <h3 className="mt-3 text-sm font-semibold text-ink-900 dark:text-neutral-100">{item.title}</h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
