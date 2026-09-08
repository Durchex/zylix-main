import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Page numbers around the current page, with ellipses for the gaps — the
 * full run is unusable once a catalog has dozens of pages.
 * Always includes the first and last page so the ends stay reachable.
 */
function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current]);
  if (current - 1 > 1) pages.add(current - 1);
  if (current + 1 < total) pages.add(current + 1);
  // Bias the window toward whichever end the user isn't near, so the control
  // keeps a stable width instead of collapsing at the extremes.
  if (current <= 3) [2, 3, 4].forEach((p) => p < total && pages.add(p));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => p > 1 && pages.add(p));

  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const withGaps: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && page - previous > 1) withGaps.push("gap");
    withGaps.push(page);
  });
  return withGaps;
}

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  /** Given a page number, returns the URL for it (preserving other filters). */
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <PageLink
        href={buildHref(page - 1)}
        disabled={page <= 1}
        ariaLabel="Previous page"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </PageLink>

      {pages.map((entry, index) =>
        entry === "gap" ? (
          <span key={`gap-${index}`} className="px-2 text-sm text-neutral-400">
            …
          </span>
        ) : (
          <PageLink key={entry} href={buildHref(entry)} active={entry === page} ariaLabel={`Page ${entry}`}>
            {entry}
          </PageLink>
        ),
      )}

      <PageLink
        href={buildHref(page + 1)}
        disabled={page >= totalPages}
        ariaLabel="Next page"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  children,
  active = false,
  disabled = false,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  ariaLabel: string;
}) {
  const className = cn(
    "flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors",
    active
      ? "border-brand-600 bg-brand-600 text-white"
      : "border-neutral-200 bg-white text-ink-900 hover:border-brand-300 hover:text-brand-600 dark:border-surface-800 dark:bg-surface-900 dark:text-neutral-200",
    disabled && "pointer-events-none opacity-40",
  );

  if (disabled) {
    return (
      <span className={className} aria-disabled="true" aria-label={ariaLabel}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className} aria-label={ariaLabel} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
