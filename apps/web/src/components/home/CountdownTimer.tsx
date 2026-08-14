"use client";

import { useEffect, useState } from "react";

function getRemaining(targetIso: string) {
  const diff = Math.max(0, new Date(targetIso).getTime() - Date.now());
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { hours, minutes, seconds };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function CountdownTimer({ targetIso }: { targetIso: string }) {
  // Render the same value on the server and the first client pass. Computing
  // from Date.now() here makes hydration race the clock by a few seconds.
  const [remaining, setRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setRemaining(getRemaining(targetIso));
    const id = setInterval(() => setRemaining(getRemaining(targetIso)), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return (
    <div className="flex items-center gap-1.5" role="timer" aria-label="Deal ends in">
      {[remaining.hours, remaining.minutes, remaining.seconds].map((unit, index) => (
        <span key={index} className="flex items-center gap-1.5">
          <span className="min-w-[2.25rem] rounded-lg bg-ink-900 px-2 py-1 text-center text-sm font-bold tabular-nums text-white dark:bg-surface-800">
            {pad(unit)}
          </span>
          {index < 2 && <span className="text-sm font-bold text-neutral-400">:</span>}
        </span>
      ))}
    </div>
  );
}
