"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Spinner } from "@/components/ui/Spinner";
import type { Role } from "@/types/user";

/**
 * Client-side enforcement layer. `middleware.ts` only checks cookie
 * *presence* at the edge (it can't verify the JWT there) — this guard
 * covers the case where the cookie exists but the session turned out to be
 * invalid/expired, by reacting to the SessionProvider's resolved status.
 */
export function AuthGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    } else if (status === "authenticated" && allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace("/");
    }
  }, [status, user, allowedRoles, router, pathname]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-6 w-6 text-brand-500" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return children;
}
