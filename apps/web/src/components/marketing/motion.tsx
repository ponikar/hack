"use client";

import { animate, motion, useInView, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export const EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
  y = 16,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "p" | "h2" | "h3";
  y?: number;
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

export function Stagger({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "ul" | "ol" }) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
    >
      {children}
    </Tag>
  );
}

export const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function Item({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" }) {
  const Tag = motion[as];
  return (
    <Tag variants={item} className={className}>
      {children}
    </Tag>
  );
}

export function Counter({ to, prefix = "", suffix = "", duration = 1.2, className }: { to: number; prefix?: string; suffix?: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(0, to, { duration, ease: EASE, onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [inView, to, duration, reduce]);
  return (
    <span ref={ref} className={className}>
      {prefix}
      {v}
      {suffix}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: HTMLMotionProps<"button"> & { variant?: "primary" | "ghost" }) {
  const reduce = useReducedMotion();
  const base =
    variant === "primary"
      ? "bg-accent text-accent-ink shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_8px_20px_-12px_rgba(23,21,15,0.6)]"
      : "border border-line-strong bg-transparent text-ink hover:bg-surface";
  return (
    <motion.button
      whileHover={reduce ? undefined : { y: -1 }}
      whileTap={reduce ? undefined : { scale: 0.97, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-[15px] font-medium disabled:opacity-50 ${base} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export function useGlow() {
  return (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
}

export function GlowCard({ children, className = "", as = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" }) {
  const onMove = useGlow();
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      onPointerMove={onMove}
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`glow-card overflow-hidden rounded-xl border border-line bg-surface transition-[border-color] duration-300 hover:border-line-strong ${className}`}
    >
      {children}
    </Tag>
  );
}
