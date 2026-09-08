"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Pinned to the bottom of the panel, outside the scrolling body. */
  footer?: ReactNode;
  className?: string;
}

/**
 * Right-anchored off-canvas panel. Shares Dialog's portal/Escape/scroll-lock
 * behaviour but is a separate component rather than a Dialog variant — the
 * layout (full-height, edge-anchored, slide-in) has almost nothing in common
 * with Dialog's centered box beyond those three behaviours.
 *
 * The panel stays mounted for the length of the close transition so it can
 * animate out; `visible` drives the transform while `mounted` drives whether
 * it's in the DOM at all.
 */
export function Drawer({ open, onClose, title, children, footer, className }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Next frame, so the element is in the DOM at its off-screen start
      // position before the transform flips — otherwise it just appears.
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    setVisible(false);
    const timer = setTimeout(() => setMounted(false), 300);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className={cn(
          "absolute inset-0 bg-ink-900/50 transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-elevated transition-transform duration-300 ease-out focus:outline-none dark:bg-surface-900",
          visible ? "translate-x-0" : "translate-x-full",
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-surface-800">
          <h2 id="drawer-title" className="text-base font-semibold text-ink-900 dark:text-neutral-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-surface-800 dark:hover:text-neutral-100"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div className="border-t border-neutral-200 px-5 py-4 dark:border-surface-800">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
