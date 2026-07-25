import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 4h2l1.6 9.6a1.5 1.5 0 001.5 1.4h6.4a1.5 1.5 0 001.5-1.3L17 7H5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.3 8.1h4.9l-4.9 4h4.9"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="17" r="1" fill="currentColor" />
      <circle cx="14.5" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <LogoMark className="h-6 w-6 shrink-0 text-cta-500" />
      <span
        className={cn(
          "inline-flex items-baseline text-xl font-bold tracking-tight",
          tone === "dark" ? "text-ink-900" : "text-white",
        )}
      >
        ZylixStore
        <sup className="ml-0.5 -translate-y-1 text-[9px] font-semibold text-neutral-400">&reg;</sup>
      </span>
    </span>
  );
}
