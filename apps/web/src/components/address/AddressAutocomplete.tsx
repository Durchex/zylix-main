"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export interface ResolvedPlace {
  placeId: string;
  formattedAddress: string;
  line1: string;
  city: string;
  state: string;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Suggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

/**
 * Address search backed by our own /places proxy (the Google key stays
 * server-side). Picking a suggestion hands the caller a fully resolved
 * address including coordinates, which the courier quote uses.
 *
 * Falls back silently to a plain text field when Places isn't configured —
 * the caller's manual city/state inputs remain the source of truth then.
 */
export function AddressAutocomplete({
  label = "Search for your address",
  onSelect,
  initialValue = "",
}: {
  label?: string;
  onSelect: (place: ResolvedPlace) => void;
  initialValue?: string;
}) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Distinguishes "the user typed this" from "we just filled the box in
  // after a selection", so choosing a suggestion doesn't immediately
  // re-query for the text it inserted.
  const suppressNextSearch = useRef(false);

  useEffect(() => {
    if (suppressNextSearch.current) {
      suppressNextSearch.current = false;
      return;
    }
    const trimmed = query.trim();
    // Nothing to fetch yet. Suggestions aren't cleared here — they're gated
    // at render instead (see `visibleSuggestions`), which keeps this effect
    // free of state updates that would cascade a render on every keystroke.
    if (trimmed.length < MIN_QUERY_LENGTH) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      apiRequest<{ suggestions: Suggestion[]; available?: boolean }>(
        `/places/autocomplete?q=${encodeURIComponent(trimmed)}`,
      )
        .then((res) => {
          if (cancelled) return;
          if (res.available === false) {
            setUnavailable(true);
            setSuggestions([]);
            return;
          }
          setSuggestions(res.suggestions);
          setOpen(res.suggestions.length > 0);
        })
        .catch(() => {
          // Search being down shouldn't block the form — manual entry works.
          if (!cancelled) setSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  async function handlePick(suggestion: Suggestion) {
    setOpen(false);
    suppressNextSearch.current = true;
    setQuery(suggestion.description);
    try {
      const res = await apiRequest<{ place: ResolvedPlace }>(
        `/places/details?placeId=${encodeURIComponent(suggestion.placeId)}`,
      );
      onSelect(res.place);
    } catch {
      // Leave the typed text in place; the caller's manual fields still apply.
    }
  }

  if (unavailable) return null;

  // Derived rather than stored, so a query shrinking below the threshold
  // hides stale results without an effect writing state to do it.
  const visibleSuggestions = query.trim().length >= MIN_QUERY_LENGTH ? suggestions : [];

  return (
    <div className="relative" ref={containerRef}>
      <Input
        label={label}
        value={query}
        autoComplete="off"
        placeholder="Start typing your street, area or landmark..."
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => visibleSuggestions.length > 0 && setOpen(true)}
        helperText="Pick a suggestion to fill the fields below automatically."
      />

      {loading && (
        <span className="absolute right-3 top-[2.6rem] text-xs text-neutral-400">Searching…</span>
      )}

      {open && visibleSuggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-elevated dark:border-surface-800 dark:bg-surface-900">
          {visibleSuggestions.map((suggestion) => (
            <li key={suggestion.placeId}>
              <button
                type="button"
                onClick={() => handlePick(suggestion)}
                className={cn(
                  "block w-full px-4 py-2.5 text-left transition-colors",
                  "hover:bg-brand-50 dark:hover:bg-surface-800",
                )}
              >
                <span className="block text-sm font-medium text-ink-900 dark:text-neutral-100">
                  {suggestion.mainText}
                </span>
                {suggestion.secondaryText && (
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                    {suggestion.secondaryText}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
