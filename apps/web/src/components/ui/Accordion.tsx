"use client";

import { useState, useId } from "react";
import { cn } from "@/lib/utils";

export interface AccordionItemData {
  question: string;
  answer: string;
}

export function Accordion({ items }: { items: AccordionItemData[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div key={item.question}>
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-ink-900 hover:bg-neutral-50"
            >
              {item.question}
              <svg
                viewBox="0 0 20 20"
                className={cn("h-4 w-4 shrink-0 text-neutral-500 transition-transform", isOpen && "rotate-180")}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isOpen && (
              <div id={panelId} role="region" aria-labelledby={buttonId} className="px-5 pb-4 text-sm text-neutral-600">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
