"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { Monogram } from "./audit-rows";
import { item, useGlow } from "./motion";

export type Persona = { name: string; vendor: string; since?: string; buys: string; kills: string };

export function PersonaCard({ p }: { p: Persona }) {
  const reduce = useReducedMotion();
  const glow = useGlow();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [5, -5]), { stiffness: 250, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-5, 5]), { stiffness: 250, damping: 20 });

  return (
    <motion.li
      variants={item}
      style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        glow(e);
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
      className="glow-card flex h-full flex-col rounded-xl border border-line bg-surface p-4 transition-[border-color] duration-300 hover:border-line-strong"
    >
      <div className="flex items-center gap-2.5">
        <Monogram name={p.name} size="md" />
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold tracking-tight">{p.name}</div>
          <div className="text-[12px] text-muted">
            {p.vendor}
            {p.since && `, ${p.since}`}
          </div>
        </div>
      </div>
      <dl className="mt-4 grid gap-2.5 text-[13px] leading-snug">
        <div className="grid grid-cols-[52px_1fr] gap-2">
          <dt className="text-muted">Buys</dt>
          <dd className="text-ink-2">{p.buys}</dd>
        </div>
        <div className="grid grid-cols-[52px_1fr] gap-2">
          <dt className="text-fail">Dies on</dt>
          <dd className="text-ink-2">{p.kills}</dd>
        </div>
      </dl>
    </motion.li>
  );
}
