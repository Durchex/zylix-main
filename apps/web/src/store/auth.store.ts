import { create } from "zustand";
import type { AuthUser } from "@/types/user";

// A non-sensitive "am I logged in" marker, set on the frontend's own domain
// so proxy.ts (edge middleware, runs on this domain) can read it. The real
// refresh token lives in an httpOnly cookie scoped to the API's domain,
// which is invisible to this domain's server-side code when the frontend
// and API are deployed separately (e.g. Netlify + Render) — cookies don't
// cross domains regardless of sameSite/secure settings.
const SESSION_MARKER_COOKIE = "zylix_session";
const SESSION_MARKER_MAX_AGE_S = 30 * 24 * 60 * 60; // matches the refresh token's lifetime

function setSessionMarkerCookie() {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${SESSION_MARKER_COOKIE}=1; path=/; max-age=${SESSION_MARKER_MAX_AGE_S}; samesite=lax${secure}`;
}

function clearSessionMarkerCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_MARKER_COOKIE}=; path=/; max-age=0`;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  setSession: (user: AuthUser, accessToken: string) => void;
  clearSession: () => void;
  setStatus: (status: AuthState["status"]) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: "idle",
  setSession: (user, accessToken) => {
    setSessionMarkerCookie();
    set({ user, accessToken, status: "authenticated" });
  },
  clearSession: () => {
    clearSessionMarkerCookie();
    set({ user: null, accessToken: null, status: "unauthenticated" });
  },
  setStatus: (status) => set({ status }),
}));
