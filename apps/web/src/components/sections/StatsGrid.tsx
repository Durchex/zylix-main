export interface StatItem {
  label: string;
  value: string;
}

export function StatsGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {items.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-neutral-200 p-6 text-center dark:border-surface-800">
          <p className="text-2xl font-bold text-ink-900 dark:text-neutral-50">{stat.value}</p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
