"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useState, type ReactNode } from "react";

export function NavChrome({ children, solid }: { children: ReactNode; solid?: boolean }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));
  const on = solid || scrolled;
  return (
    <header
      className={`sticky top-0 z-30 transition-[background-color,border-color,backdrop-filter,box-shadow] duration-300 ${
        on ? "border-b border-line bg-bg/80 shadow-[0_1px_0_rgba(0,0,0,0.02)] backdrop-blur-md" : "border-b border-transparent bg-transparent"
      }`}
    >
      {children}
    </header>
  );
}
