"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { refreshSession } from "@/lib/api-client";
import { hasSessionMarker } from "@/lib/session-marker";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const clearSession = useAuthStore((s) => s.clearSession);
  const setStatus = useAuthStore((s) => s.setStatus);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      // A visitor who has never logged in has no session to restore, and the
      // marker cookie is how we know that without asking the server. Without
      // this check every guest page load fired a refresh that could only ever
      // 401 — a red error in the network tab on every single page.
      if (!hasSessionMarker()) {
        setStatus("unauthenticated");
        return;
      }

      setStatus("loading");
      const outcome = await refreshSession();
      if (cancelled) return;

      if (outcome === "expired") {
        // The server said definitively that this session is gone.
        clearSession();
      } else if (outcome === "unavailable") {
        // A 500 or a dropped connection tells us nothing about whether the
        // session is still good. Logging the user out here is what made a
        // brief server hiccup look like an authentication error — leave the
        // marker alone so the next request can try again.
        setStatus("unauthenticated");
      }
      // "refreshed" already populated the store.
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
    // Runs once on mount; the store setters are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return children;
}
