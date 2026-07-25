"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { apiRequest, ApiRequestError } from "@/lib/api-client";
import type { AuthUser } from "@/types/user";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setStatus = useAuthStore((s) => s.setStatus);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setStatus("loading");
      try {
        const data = await apiRequest<{ user: AuthUser; accessToken: string }>(
          "/auth/refresh",
          { method: "POST", skipAuthRetry: true },
        );
        if (!cancelled) setSession(data.user, data.accessToken);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiRequestError && err.status === 401) {
            clearSession();
          } else {
            setStatus("unauthenticated");
          }
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return children;
}
