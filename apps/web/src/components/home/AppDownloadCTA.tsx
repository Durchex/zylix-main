function StoreButton({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <span className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-white">
      <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M10 2a1 1 0 011 1v10.6l3-3a1 1 0 111.4 1.4l-4.7 4.7a1 1 0 01-1.4 0L4.6 12a1 1 0 111.4-1.4l3 3V3a1 1 0 011-1z" />
        <path d="M4 16a1 1 0 011 1v.5c0 .3.2.5.5.5h9a.5.5 0 00.5-.5V17a1 1 0 112 0v.5a2.5 2.5 0 01-2.5 2.5h-9A2.5 2.5 0 013 17.5V17a1 1 0 011-1z" />
      </svg>
      <span className="text-left leading-tight">
        <span className="block text-[10px] uppercase tracking-wide text-white/70">{sublabel}</span>
        <span className="block text-sm font-semibold">{label}</span>
      </span>
    </span>
  );
}

export function AppDownloadCTA() {
  return (
    <section className="rounded-2xl bg-ink-900 px-6 py-10 text-white sm:px-10 dark:bg-surface-900">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Get the ZylixStore app</h2>
          <p className="mt-2 max-w-md text-sm text-neutral-300">
            App-only deals, faster checkout, and order tracking that comes straight to your
            phone. Download today for an even better shopping experience.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <StoreButton sublabel="Download on the" label="App Store" />
          <StoreButton sublabel="Get it on" label="Google Play" />
        </div>
      </div>
    </section>
  );
}
