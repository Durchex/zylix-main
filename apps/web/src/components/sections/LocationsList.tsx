export interface Location {
  name: string;
  address: string;
  phone: string;
  hours: string;
}

export function LocationsList({ title, items }: { title: string; items: Location[] }) {
  return (
    <section className="mt-10 border-t border-neutral-200 pt-8 dark:border-surface-800">
      <h2 className="mb-4 text-lg font-bold text-ink-900 dark:text-neutral-50">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((location) => (
          <div key={location.name} className="rounded-2xl border border-neutral-200 p-5 dark:border-surface-800">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-neutral-100">{location.name}</h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{location.address}</p>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{location.phone}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{location.hours}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
