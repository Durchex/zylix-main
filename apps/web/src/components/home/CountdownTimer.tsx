"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function getRemaining(targetIso: string, withDays: boolean) {
  const diff = Math.max(0, new Date(targetIso).getTime() - Date.now());
  const days = withDays ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
  const hours = Math.floor(diff / (1000 * 60 * 60)) - days * 24;
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function CountdownTimer({
  targetIso,
  showDays = false,
  variant = "compact",
  className,
}: {
  targetIso: string;
  /** Rolls hours past 24 into a separate days unit. */
  showDays?: boolean;
  /** "compact" = inline HH:MM:SS chips; "labelled" = larger boxes with unit captions. */
  variant?: "compact" | "labelled";
  className?: string;
}) {
  // Render the same value on the server and the first client pass. Computing
  // from Date.now() here makes hydration race the clock by a few seconds.
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => setRemaining(getRemaining(targetIso, showDays));
    // The first tick is deferred rather than run synchronously in the effect
    // body: computing it during the effect would set state in the same commit
    // that mounted the component, cascading an immediate re-render. A 0ms
    // timeout runs right after paint, so there's no visible delay.
    const immediate = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(immediate);
      clearInterval(interval);
    };
  }, [targetIso, showDays]);

  const units = [
    ...(showDays ? [{ label: "Days", value: remaining.days }] : []),
    { label: "Hours", value: remaining.hours },
    { label: "Minutes", value: remaining.minutes },
    { label: "Seconds", value: remaining.seconds },
  ];

  if (variant === "labelled") {
    return (
      <div className={cn("flex items-center gap-2", className)} role="timer" aria-label="Offer ends in">
        {units.map((unit) => (
          <span
            key={unit.label}
            className="flex min-w-[3.25rem] flex-col items-center rounded-xl bg-white/15 px-2 py-1.5 backdrop-blur"
          >
            <span className="text-lg font-bold tabular-nums leading-none text-white">{pad(unit.value)}</span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-white/70">
              {unit.label}
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)} role="timer" aria-label="Deal ends in">
      {units.map((unit, index) => (
        <span key={unit.label} className="flex items-center gap-1.5">
          <span className="min-w-[2.25rem] rounded-lg bg-ink-900 px-2 py-1 text-center text-sm font-bold tabular-nums text-white dark:bg-surface-800">
            {pad(unit.value)}
          </span>
          {index < units.length - 1 && <span className="text-sm font-bold text-neutral-400">:</span>}
        </span>
      ))}
    </div>
  );
}
