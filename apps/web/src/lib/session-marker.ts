/**
 * The non-sensitive "someone has logged in on this browser" cookie.
 *
 * The real credential is the httpOnly refresh cookie, which JavaScript can't
 * see. This marker is set alongside it (see auth.store.ts) precisely so the
 * client — and the edge proxy — can tell "has a session" from "never logged
 * in" without making a request to find out.
 */
export const SESSION_MARKER_COOKIE = "zylix_session";

export function hasSessionMarker(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((entry) => entry.startsWith(`${SESSION_MARKER_COOKIE}=`));
}
