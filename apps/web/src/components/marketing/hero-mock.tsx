import { Fragment } from "react";
import { Check, X } from "lucide-react";
import { StepChip, StepConnector, type ChipStatus } from "@/components/run/step-chip";
import { OverallPill, StatusPill } from "@/components/run/badges";

type MockStep = { label: string; status: ChipStatus; detail?: string; highlight?: boolean };
type MockRow = { persona: string; archetype: string; template: string; steps: MockStep[]; note: string; tone?: "ok" | "fail" | "warn" };

const ok = (label: string): MockStep => ({ label, status: "ok" });

const ROWS: MockRow[] = [
  {
    persona: "ChatGPT Shopping",
    archetype: "Feed reader",
    template: "feed-reader",
    steps: [ok("Fetch product"), ok("Price in HTML"), ok("Product schema")],
    note: "Read name, price and stock without JavaScript.",
    tone: "ok",
  },
  {
    persona: "Google AI Mode",
    archetype: "Feed reader",
    template: "direct-link",
    steps: [ok("Fetch product"), ok("Price in HTML"), ok("Product schema")],
    note: "Read name, price and stock without JavaScript.",
    tone: "ok",
  },
  {
    persona: "ChatGPT Atlas",
    archetype: "Browser agent",
    template: "search-first",
    steps: [
      ok("Open store"),
      ok("Dismiss popup"),
      ok("Search"),
      ok("Open product"),
      ok("Add to cart"),
      { label: "Checkout", status: "blocked", detail: "login wall", highlight: true },
      { label: "Payment gate", status: "skipped" },
    ],
    note: "Checkout requires an account login. Guest checkout is not available.",
    tone: "fail",
  },
  {
    persona: "Perplexity Comet",
    archetype: "Browser agent",
    template: "cart-drawer",
    steps: [ok("Open store"), ok("Open product"), ok("Pick variant"), ok("Add to cart"), ok("Checkout"), { label: "Payment gate", status: "stopped" }],
    note: "Reached the payment step. Stopped on purpose; nothing was bought.",
    tone: "ok",
  },
  {
    persona: "Amazon Buy for Me",
    archetype: "Browser agent",
    template: "buy-now",
    steps: [ok("Open store"), ok("Browse category"), ok("Open product"), ok("Buy now"), { label: "Payment gate", status: "stopped" }],
    note: "Reached the payment step. Stopped on purpose; nothing was bought.",
    tone: "ok",
  },
];

const TILES: { name: string; v: "pass" | "fail"; q: string }[] = [
  { name: "Seen", v: "pass", q: "Readable without JavaScript" },
  { name: "Listed", v: "pass", q: "Product schema and feed present" },
  { name: "Buyable", v: "fail", q: "1 of 3 agents blocked at checkout" },
];

const FIXES = [
  { title: "Enable guest checkout", detail: "Checkout demanded an account. Agents shop as guests; a login wall loses the sale.", who: ["ChatGPT Atlas"] },
  { title: "Don't gate the page behind a popup", detail: "The newsletter modal took two attempts to close. Defer it until after the first interaction.", who: ["ChatGPT Atlas", "Perplexity Comet"] },
];

export function HeroMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-bg shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-24px_rgba(0,0,0,0.25)]" aria-label="Example audit result">
      <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
        </span>
        <span className="ml-2 truncate font-mono text-xs text-muted">watchdog.app/dashboard/7f3a…</span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-base font-medium sm:text-lg">northwind-supply.com</span>
          <StatusPill status="done" />
          <span className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-muted">Overall</span>
            <OverallPill overall="listed" />
          </span>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {["Shopify", "Server-rendered", "Cart drawer", "Product JSON-LD", "Variants required"].map((c) => (
            <span key={c} className="inline-flex h-6 items-center rounded-md border border-line bg-surface px-2 text-xs font-medium text-ink-2">
              {c}
            </span>
          ))}
          {["reCAPTCHA", "Newsletter popup"].map((c) => (
            <span key={c} className="inline-flex h-6 items-center rounded-md border border-warn/30 bg-warn-soft px-2 text-xs font-medium text-warn">
              {c}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          {TILES.map((t) => (
            <div key={t.name} className="flex items-center gap-3 bg-bg px-3.5 py-3">
              <span className={`grid size-7 shrink-0 place-items-center rounded-full ${t.v === "pass" ? "bg-ok-soft text-ok" : "bg-fail-soft text-fail"}`}>
                {t.v === "pass" ? <Check className="size-4" strokeWidth={2.5} aria-hidden /> : <X className="size-4" strokeWidth={2.5} aria-hidden />}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold">
                  {t.name} <span className={`font-normal ${t.v === "pass" ? "text-ok" : "text-fail"}`}>{t.v === "pass" ? "Pass" : "Fail"}</span>
                </div>
                <div className="truncate text-xs text-muted">{t.q}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 divide-y divide-line border-y border-line">
          {ROWS.map((r) => (
            <div key={r.persona} className="grid gap-1.5 py-3 md:grid-cols-[176px_1fr] md:gap-4">
              <div className="flex items-baseline gap-2 md:block">
                <div className="text-sm font-semibold">{r.persona}</div>
                <div className="text-xs text-muted">
                  {r.archetype} <span aria-hidden>·</span> <span className="font-mono">{r.template}</span>
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center overflow-x-auto pb-1 [scrollbar-width:thin]">
                  {r.steps.map((s, i) => (
                    <Fragment key={i}>
                      {i > 0 && <StepConnector tone={r.steps[i - 1].status === "blocked" || r.steps[i - 1].status === "failed" ? "fail" : "line"} />}
                      <StepChip label={s.label} status={s.status} detail={s.detail} highlight={s.highlight} />
                    </Fragment>
                  ))}
                </div>
                <p className={`mt-1 text-[13px] leading-snug ${r.tone === "fail" ? "text-fail" : "text-muted"}`}>{r.note}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="text-sm font-semibold">
            What to fix <span className="font-normal text-muted">2 fixes</span>
          </div>
          <ol className="mt-2 divide-y divide-line rounded-lg border border-line">
            {FIXES.map((f) => (
              <li key={f.title} className="grid gap-1.5 p-3.5 md:grid-cols-[1fr_auto] md:gap-6">
                <div>
                  <div className="text-sm font-medium">{f.title}</div>
                  <p className="mt-0.5 text-[13px] leading-snug text-ink-2">{f.detail}</p>
                </div>
                <div className="flex flex-wrap gap-1 md:justify-end">
                  {f.who.map((w) => (
                    <span key={w} className="inline-flex h-6 items-center rounded-md bg-surface px-2 text-xs font-medium text-ink-2">
                      {w}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
