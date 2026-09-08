import { cn } from "@/lib/utils";

/**
 * The "Z" tile — a blue rounded square with a stylised Z cut through it.
 * Kept as a standalone export so compact surfaces (favicon route, mobile
 * headers) can use the mark without the wordmark.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[60%] w-[60%]">
        <path
          d="M7 6h10L8 18h10"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  tone = "dark",
  showTagline = true,
}: {
  className?: string;
  tone?: "dark" | "light";
  /** Hidden on tight surfaces (mobile header, footer columns). */
  showTagline?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="h-9 w-9" />
      <span className="inline-flex flex-col leading-none">
        <span
          className={cn(
            "text-xl font-bold tracking-tight",
            tone === "dark" ? "text-ink-900 dark:text-white" : "text-white",
          )}
        >
          ZylixStore
        </span>
        {showTagline && (
          <span
            className={cn(
              "mt-0.5 text-[10px] font-medium tracking-tight",
              tone === "dark" ? "text-neutral-500 dark:text-neutral-400" : "text-white/70",
            )}
          >
            Electronics. Better Living.
          </span>
        )}
      </span>
    </span>
  );
}
