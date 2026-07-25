"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Scroll-triggered fade/slide-up wrapper. Kept as a small standalone client
 * component so Server Components (e.g. the homepage's data-fetching
 * sections) can wrap their static, server-rendered output in an animation
 * without themselves becoming client components.
 */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
