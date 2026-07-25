"use client";

import { useEffect, useState } from "react";

function timeLeftUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = Math.max(0, midnight.getTime() - now.getTime());
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { hours, minutes, seconds };
}

export function CountdownTimer() {
  const [time, setTime] = useState(timeLeftUntilMidnight);

  useEffect(() => {
    const interval = setInterval(() => setTime(timeLeftUntilMidnight()), 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-1 text-sm font-semibold tabular-nums text-brand-700 dark:text-accent-400">
      <span className="rounded bg-brand-50 px-2 py-1 dark:bg-brand-900/30">{pad(time.hours)}</span>:
      <span className="rounded bg-brand-50 px-2 py-1 dark:bg-brand-900/30">{pad(time.minutes)}</span>:
      <span className="rounded bg-brand-50 px-2 py-1 dark:bg-brand-900/30">{pad(time.seconds)}</span>
      <span className="ml-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">left today</span>
    </div>
  );
}
