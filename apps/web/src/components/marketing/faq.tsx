"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { EASE } from "./motion";

const ITEMS = [
  {
    q: "Is anything bought?",
    a: "No. Browser agents stop at the payment step of a live store and the run is marked stopped, never paid. Feed readers only fetch pages.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. Paste a public store URL. Watchdog runs the probes and the browser replays from its own infrastructure.",
  },
  {
    q: "What about bot protection?",
    a: "If Cloudflare, DataDome, a CAPTCHA or a WAF stops the agent, that is the finding: the exact step, the screenshot and the vendor. Watchdog does not bypass it.",
  },
  {
    q: "Which stores?",
    a: "Shopify, WooCommerce, BigCommerce, Magento and custom storefronts. Platform is detected from headers and markup and shapes the journeys.",
  },
  {
    q: "Is it free?",
    a: "Free during beta. Run as many audits as you like; the only limit is one run per store at a time.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="divide-y divide-line border-y border-line">
      {ITEMS.map((it, i) => {
        const isOpen = open === i;
        return (
          <li key={it.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-${i}`}
              className="group flex w-full items-center justify-between gap-6 py-4 text-left"
            >
              <span className="text-[16px] font-medium tracking-tight transition-colors group-hover:text-fail sm:text-[17px]">{it.q}</span>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3, ease: EASE }} className="grid size-7 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors group-hover:border-line-strong">
                <ChevronDown className="size-4" aria-hidden />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`faq-${i}`}
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className="max-w-xl pb-5 text-[15px] leading-relaxed text-ink-2">{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
