import Link from "next/link";
import {
  ArrowUpRight,
  Ban,
  Braces,
  Check,
  FileCode,
  KeyRound,
  MessageSquareWarning,
  Rss,
  ShieldAlert,
  ShieldBan,
  TextCursorInput,
  X,
} from "lucide-react";
import { Counter, GlowCard, Item, Reveal, Stagger } from "./motion";
import { PersonaCard, type Persona } from "./persona-card";
import { UrlForm } from "./url-form";
import { Logo } from "./nav";

export function Section({ id, children, className = "" }: { id?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-14 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">{children}</div>
    </section>
  );
}

export function Heading({ title, lead, children }: { title: string; lead?: string; children?: React.ReactNode }) {
  return (
    <Reveal className="max-w-2xl">
      <h2 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">{title}</h2>
      {lead && <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-ink-2">{lead}</p>}
      {children}
    </Reveal>
  );
}

const PROOF: { claim: string; source: string; href: string }[] = [
  { claim: "None of the major AI crawlers execute JavaScript.", source: "Vercel, Dec 2024", href: "https://vercel.com/blog/the-rise-of-the-ai-crawler" },
  { claim: "GPT-5 solved 28% of CAPTCHAs. The best model, 60%.", source: "Proof of Human research", href: "https://research.poh.org/captcha-benchmarking/" },
  { claim: "Every Shopify store serves /agents.md and /llms.txt.", source: "Shopify changelog, 28 May 2026", href: "https://shopify.dev/changelog/customize-llmstxt-llms-fulltxt-and-agentsmd" },
  { claim: "Unsigned agents get Shopify's strictest rate limits.", source: "Shopify changelog, 7 May 2026", href: "https://shopify.dev/changelog/bots-and-agents-should-identify-themselves-via-web-bot-auth" },
  { claim: "Shop Pay checkout is on by default for agents.", source: "Shopify docs, 21 Sep 2026", href: "https://shopify.dev/docs/agents/checkout" },
  { claim: "UCP launched at NRF with Google, Shopify, Walmart and Target.", source: "Shopify Engineering, 11 Jan 2026", href: "https://shopify.engineering/UCP" },
  { claim: "ChatGPT Instant Checkout runs on the Agentic Commerce Protocol.", source: "Stripe, 29 Sep 2025", href: "https://stripe.com/newsroom/news/stripe-openai-instant-checkout" },
  { claim: "Perplexity Instant Buy pays through PayPal.", source: "PayPal, 25 Nov 2025", href: "https://newsroom.paypal-corp.com/2025-11-PayPal-and-Perplexity-Launch-Instant-Buy" },
  { claim: "Amazon Buy for Me grew from 65,000 to 500,000+ items in 2025.", source: "Amazon", href: "https://www.aboutamazon.com/news/retail/amazon-shopping-app-buy-for-me-brands" },
];

export function ProofStrip() {
  const list = [...PROOF, ...PROOF];
  return (
    <div className="marquee border-y border-line bg-surface/60" aria-label="Facts about AI buyers, with sources">
      <div className="relative overflow-hidden py-4 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <ul className="marquee-track flex w-max gap-10 pr-10">
          {list.map((p, i) => (
            <li key={i} className="flex shrink-0 items-baseline gap-2.5 whitespace-nowrap text-[13.5px]" aria-hidden={i >= PROOF.length}>
              <span className="size-1.5 shrink-0 translate-y-[-2px] rounded-full bg-fail" aria-hidden />
              <span className="font-medium">{p.claim}</span>
              <a href={p.href} target="_blank" rel="noreferrer" className="text-[12px] text-muted underline-offset-2 hover:text-ink hover:underline">
                {p.source}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <Section id="how">
      <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <Heading title="One URL in. A fix list out." />
        <Reveal delay={0.1} className="flex gap-8 sm:gap-12">
          {[
            { n: 8, label: "HTTP probes" },
            { n: 7, label: "AI buyers" },
            { n: 0, label: "purchases made" },
          ].map((s) => (
            <div key={s.label}>
              <Counter to={s.n} className="block text-[40px] font-semibold leading-none tracking-[-0.04em] tabular-nums sm:text-[52px]" />
              <div className="mt-1.5 text-[13px] text-muted">{s.label}</div>
            </div>
          ))}
        </Reveal>
      </div>

      <Stagger as="ol" className="mt-14 grid gap-4 md:grid-cols-3">
        <Step n={1} title="Profile" time="~8s" body="Eight probes read the store like a crawler: platform, rendering, schema, feed, robots.txt, bot protection, cart, checkout.">
          <ProbeArt />
        </Step>
        <Step n={2} title="Replay" time="under 2 min" body="Each buyer gets the journey it would attempt. Feed readers fetch without JavaScript. Browser agents drive a real Chromium.">
          <ReplayArt />
        </Step>
        <Step n={3} title="Fix" time="you" body="The exact failing step, its screenshot, the plain-English reason, and what unblocks which buyer.">
          <FixArt />
        </Step>
      </Stagger>
    </Section>
  );
}

function Step({ n, title, time, body, children }: { n: number; title: string; time: string; body: string; children: React.ReactNode }) {
  return (
    <Item as="li" className="h-full">
      <GlowCard className="flex h-full flex-col">
        <div className="flex h-36 items-center justify-center border-b border-line bg-bg/60">{children}</div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[19px] font-semibold tracking-tight">
              <span className="mr-2 text-muted">{n}</span>
              {title}
            </h3>
            <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[11.5px] text-ink-2">{time}</span>
          </div>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{body}</p>
        </div>
      </GlowCard>
    </Item>
  );
}

function ProbeArt() {
  const pts = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return { x: 60 + Math.cos(a) * 44, y: 60 + Math.sin(a) * 44 };
  });
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
      <circle cx="60" cy="60" r="44" className="stroke-line" fill="none" />
      <circle cx="60" cy="60" r="24" className="stroke-line" fill="none" />
      <g className="origin-center animate-[spin_3s_linear_infinite]" style={{ transformOrigin: "60px 60px" }}>
        <path d="M60 60 L60 16 A44 44 0 0 1 91 29 Z" className="fill-fail/15" />
        <line x1="60" y1="60" x2="60" y2="16" className="stroke-fail" strokeWidth="1.5" />
      </g>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" className="fill-ink" style={{ animation: `pulse-soft 3s linear infinite`, animationDelay: `${(i / 8) * 3}s` }} />
      ))}
      <circle cx="60" cy="60" r="4" className="fill-ink" />
    </svg>
  );
}

function ReplayArt() {
  const chips = ["ok", "ok", "ok", "blocked"] as const;
  return (
    <svg width="200" height="60" viewBox="0 0 200 60" aria-hidden>
      <line x1="10" y1="30" x2="190" y2="30" className="dash-flow stroke-line-strong" strokeWidth="1.5" />
      {chips.map((s, i) => (
        <g key={i} transform={`translate(${10 + i * 56} 18)`}>
          <rect width="28" height="24" rx="6" className={s === "ok" ? "fill-ok-soft stroke-ok/40" : "fill-fail-soft stroke-fail/50"} />
          {s === "ok" ? (
            <path d="M8 12.5l4 4 8-8" className="stroke-ok" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ) : (
            <g className="stroke-fail" strokeWidth="2.25" strokeLinecap="round">
              <line x1="9" y1="7" x2="19" y2="17" />
              <line x1="19" y1="7" x2="9" y2="17" />
            </g>
          )}
        </g>
      ))}
      <g className="animate-[pulse-soft_1.4s_ease-in-out_infinite]">
        <path d="M172 6 l0 14 l4 -3 l3 6 l3 -1.5 l-3 -6 l5 -0.5 z" className="fill-ink" />
      </g>
    </svg>
  );
}

function FixArt() {
  return (
    <svg width="160" height="84" viewBox="0 0 160 84" aria-hidden>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(0 ${i * 28})`}>
          <rect x="0" y="0" width="160" height="22" rx="6" className="fill-surface stroke-line" />
          <rect x="0" y="0" width="3" height="22" rx="1.5" className={i === 0 ? "fill-ok" : "fill-fail"} />
          <rect x="12" y="7" width={i === 0 ? 70 : 90 + i * 12} height="8" rx="4" className="fill-line-strong" />
          {i === 0 ? (
            <path d="M138 11l4 4 7-7" className="stroke-ok" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ) : (
            <rect x="136" y="6" width="14" height="10" rx="3" className="fill-surface-2" />
          )}
        </g>
      ))}
    </svg>
  );
}

const FEED_READERS: Persona[] = [
  { name: "ChatGPT Shopping", vendor: "OpenAI", since: "Sep 2025", buys: "Reads your feed and product page, then Instant Checkout over the Agentic Commerce Protocol.", kills: "Price only after JavaScript. No feed or Product JSON-LD. GPTBot blocked." },
  { name: "Grok", vendor: "xAI", since: "Aug 2026", buys: "Fetches product pages; Grok Bot pays with a single-use Stripe card.", kills: "Empty server HTML. robots.txt disallow. 403 from the WAF." },
  { name: "Perplexity search", vendor: "Perplexity", since: "Nov 2025", buys: "Answers from crawled pages, then Instant Buy through PayPal.", kills: "PerplexityBot disallowed. Challenge page instead of HTML." },
  { name: "Google AI Mode", vendor: "Google", since: "Jan 2026", buys: "Merchant Center data and UCP checkout inside AI Mode.", kills: "Missing Product schema. Variants and stock not machine-readable." },
];

const BROWSER_AGENTS: Persona[] = [
  { name: "ChatGPT Atlas", vendor: "OpenAI", since: "Oct 2025", buys: "Agent mode drives Chromium through search, cart and guest checkout.", kills: "Login wall. CAPTCHA at checkout. Modal with no close control." },
  { name: "Perplexity Comet", vendor: "Perplexity", since: "2025", buys: "Browses like a shopper and pays with Instant Buy.", kills: "Cloudflare challenge. Newsletter popup. Add-to-cart that does nothing." },
  { name: "Amazon Buy for Me", vendor: "Amazon", since: "Apr 2025", buys: "Buys from your site inside the Amazon app; 500k+ items by end of 2025.", kills: "Account required. CAPTCHA. Form that rejects its input." },
];

export function Buyers() {
  return (
    <Section id="buyers" className="border-t border-line bg-surface/50">
      <Heading title="Seven buyers. Two ways of shopping." lead="Feed readers fetch your pages once, with JavaScript off. Browser agents drive a real browser to the payment step." />
      <div className="mt-12 grid gap-10">
        <Group title="Feed readers" hint="Die before the cart" people={FEED_READERS} cols="lg:grid-cols-4" />
        <Group title="Browser agents" hint="Die at checkout" people={BROWSER_AGENTS} cols="lg:grid-cols-3" />
      </div>
    </Section>
  );
}

function Group({ title, hint, people, cols }: { title: string; hint: string; people: Persona[]; cols: string }) {
  return (
    <div>
      <Reveal className="flex items-baseline gap-3">
        <h3 className="text-[20px] font-semibold tracking-tight">{title}</h3>
        <span className="text-[13px] text-fail">{hint}</span>
      </Reveal>
      <Stagger as="ul" className={`mt-4 grid gap-3 sm:grid-cols-2 ${cols}`}>
        {people.map((p) => (
          <PersonaCard key={p.name} p={p} />
        ))}
      </Stagger>
    </div>
  );
}

const KILLERS = [
  { icon: FileCode, title: "JavaScript-only rendering", check: "Seen", body: "Price and stock exist only after hydration. The feed reader sees an empty shell and moves on." },
  { icon: Braces, title: "No Product JSON-LD", check: "Listed", body: "Nothing machine-readable to list. Your product is not in the answer, so it cannot be bought." },
  { icon: Rss, title: "No product feed", check: "Listed", body: "No products.json, no Merchant Center, no ACP feed. Shopping surfaces index competitors instead." },
  { icon: Ban, title: "robots.txt block", check: "Seen", body: "Disallow GPTBot or PerplexityBot and those assistants never learn the store exists." },
  { icon: ShieldBan, title: "WAF challenge", check: "Seen", body: "The crawler receives a 403 or an interstitial instead of HTML. Every page reads as blank." },
  { icon: ShieldAlert, title: "CAPTCHA", check: "Buyable", body: "The agent reaches checkout and is asked to prove it is human. It cannot. The session ends there." },
  { icon: MessageSquareWarning, title: "Popup", check: "Buyable", body: "A newsletter or consent modal sits over Add to cart. Clicks hit the overlay and nothing happens." },
  { icon: KeyRound, title: "Login wall", check: "Buyable", body: "Checkout demands an account. Agents shop as guests, so the sale dies one step from payment." },
  { icon: TextCursorInput, title: "Broken form", check: "Buyable", body: "A required field with no label, a rejected postcode, a disabled button. The agent retries, then quits." },
];

export function Killers() {
  return (
    <Section id="killers" className="border-t border-line">
      <Heading title="Where the sale dies" lead="Nine things a human shopper walks past. Each one is a check in the audit and a line in the fix list." />
      <Stagger as="ul" className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {KILLERS.map((k) => (
          <Item key={k.title} as="li" className="group bg-surface p-5 transition-colors hover:bg-bg">
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-lg bg-fail-soft text-fail transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
                <k.icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                <X className="size-3 text-fail" strokeWidth={3} aria-hidden />
                {k.check}
              </span>
            </div>
            <h3 className="mt-4 text-[16px] font-semibold tracking-tight">{k.title}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{k.body}</p>
          </Item>
        ))}
      </Stagger>
    </Section>
  );
}

const COMPARE: { row: string; checklist: boolean; watchdog: boolean }[] = [
  { row: "Product JSON-LD present", checklist: true, watchdog: true },
  { row: "/agents.md and /llms.txt served", checklist: true, watchdog: true },
  { row: "Price readable without JavaScript", checklist: false, watchdog: true },
  { row: "Popup escapable by an agent", checklist: false, watchdog: true },
  { row: "Guest checkout reachable in a real browser", checklist: false, watchdog: true },
  { row: "CAPTCHA or challenge at checkout", checklist: false, watchdog: true },
  { row: "Screenshot of the step that failed", checklist: false, watchdog: true },
];

const SHOPIFY_FACTS = [
  { date: "28 May 2026", text: "Every store serves /agents.md, mirrored at /llms.txt. Watchdog reads it and follows the MCP endpoints it lists." },
  { date: "30 May 2026", text: "Unsigned bots get the strictest rate limits; Web Bot Auth signatures get more. Watchdog reports which tier your store put the agent in." },
  { date: "21 Sep 2026", text: "Shop Pay checkout is on by default for agents. Being reachable is now the only thing between an agent and your checkout." },
];

export function Shopify() {
  return (
    <Section id="shopify" className="border-t border-line bg-surface/50">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <Heading title="Built for Shopify stores" lead="Shopify made every store agent-ready by default. Whether an agent can actually finish the journey on your theme is the part nobody checks." />
          <Reveal delay={0.1}>
            <ol className="mt-8 divide-y divide-line border-y border-line">
              {SHOPIFY_FACTS.map((f) => (
                <li key={f.date} className="grid gap-1 py-3.5 sm:grid-cols-[112px_1fr] sm:gap-4">
                  <span className="font-mono text-[12px] text-muted">{f.date}</span>
                  <span className="text-[14px] leading-relaxed text-ink-2">{f.text}</span>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={0.15} className="mt-8">
            <UrlForm size="md" placeholder="yourstore.myshopify.com" />
            <p className="mt-3 text-[13px] text-muted">Also WooCommerce, BigCommerce, Magento and custom storefronts. Platform is detected from the first probe.</p>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <GlowCard className="overflow-hidden">
            <div className="grid grid-cols-[1fr_88px_88px] items-center border-b border-line bg-bg/60 px-4 py-3 text-[12px] text-muted sm:grid-cols-[1fr_120px_120px]">
              <span>Check</span>
              <span className="text-center">Static checklist</span>
              <span className="text-center font-semibold text-ink">Watchdog</span>
            </div>
            <ul className="divide-y divide-line">
              {COMPARE.map((c) => (
                <li key={c.row} className="grid grid-cols-[1fr_88px_88px] items-center px-4 py-3 text-[13.5px] sm:grid-cols-[1fr_120px_120px]">
                  <span>{c.row}</span>
                  <Mark v={c.checklist} />
                  <Mark v={c.watchdog} />
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-4 py-3 text-[12.5px] text-muted">A checklist reads your markup. Watchdog also drives the store as each buyer and records where it stops.</p>
          </GlowCard>
        </Reveal>
      </div>
    </Section>
  );
}

function Mark({ v }: { v: boolean }) {
  return (
    <span className="flex justify-center">
      {v ? (
        <span className="grid size-5 place-items-center rounded-full bg-ok-soft text-ok">
          <Check className="size-3" strokeWidth={3} aria-hidden />
        </span>
      ) : (
        <span className="h-px w-3 bg-line-strong" aria-label="no" />
      )}
    </span>
  );
}

export function FinalCta() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <Reveal className="max-w-2xl">
          <h2 className="text-[36px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[56px]">Find out where AI buyers give up on your store.</h2>
          <div className="mt-8">
            <UrlForm secondary />
          </div>
          <p className="mt-6 text-[14px] text-muted">
            No store yet?{" "}
            <Link href="/store?mode=broken" className="font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-fail">
              Open the demo store
            </Link>{" "}
            and watch it fail.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 text-[13.5px] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-muted">An AI mystery shopper for your store.</span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-ink-2" aria-label="Footer">
          <Link href="/dashboard" className="transition-colors hover:text-ink">
            Dashboard
          </Link>
          <Link href="/store?mode=broken" className="transition-colors hover:text-ink">
            Demo store
          </Link>
          <a href="https://github.com/ponikar/hack" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 transition-colors hover:text-ink">
            GitHub
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </nav>
      </div>
    </footer>
  );
}
