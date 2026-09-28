import Link from "next/link";
import {
  ArrowUpRight,
  Ban,
  Braces,
  Check,
  FileCode,
  KeyRound,
  MessageSquareWarning,
  ShieldAlert,
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
  { claim: "Shop Pay checkout is on by default for agents.", source: "Shopify docs, 21 Sep 2026", href: "https://shopify.dev/docs/agents/checkout" },
  { claim: "ChatGPT Instant Checkout runs on the Agentic Commerce Protocol.", source: "Stripe, 29 Sep 2025", href: "https://stripe.com/newsroom/news/stripe-openai-instant-checkout" },
  { claim: "Amazon Buy for Me grew from 65,000 to 500,000+ items in 2025.", source: "Amazon", href: "https://www.aboutamazon.com/news/retail/amazon-shopping-app-buy-for-me-brands" },
];

const TECHCRUNCH = "https://techcrunch.com/2026/04/16/ai-traffic-to-us-retailers-rose-393-in-q1-and-its-boosting-their-revenue-too/";

const FACTS: { stat: string; text: string; source: string; href: string }[] = [
  { stat: "393%", text: "more AI-referred retail traffic, Q1 2026", source: "TechCrunch", href: TECHCRUNCH },
  { stat: "42%", text: "higher conversion than search", source: "TechCrunch", href: TECHCRUNCH },
  { stat: "~13x", text: "more AI-referred orders on Shopify", source: "Shopify", href: "https://www.shopify.com/blog/how-agentic-commerce-works" },
];

export function ProofFacts() {
  return (
    <div className="border-t border-line">
      <Stagger as="ul" className="mx-auto grid max-w-6xl gap-px px-4 py-10 sm:grid-cols-3 sm:px-6">
        {FACTS.map((f) => (
          <Item key={f.stat} as="li" className="flex flex-col gap-1 py-3 sm:px-6 sm:first:pl-0 sm:last:pr-0 sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-line">
            <span className="text-[40px] font-semibold leading-none tracking-[-0.04em] tabular-nums sm:text-[48px]">{f.stat}</span>
            <span className="mt-1 text-[14px] leading-snug text-ink-2">{f.text}</span>
            <a href={f.href} target="_blank" rel="noreferrer" className="mt-1 inline-flex w-fit items-center gap-1 text-[12px] text-muted underline-offset-2 hover:text-ink hover:underline">
              {f.source}
              <ArrowUpRight className="size-3" aria-hidden />
            </a>
          </Item>
        ))}
      </Stagger>
    </div>
  );
}

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
        <Heading title="One URL in. Seven journeys out." />
        <Reveal delay={0.1} className="flex gap-8 sm:gap-12">
          {[
            { n: 8, label: "HTTP probes" },
            { n: 7, label: "AI buyers" },
            { n: 1, label: "screenshot per failure" },
          ].map((s) => (
            <div key={s.label}>
              <Counter to={s.n} className="block text-[40px] font-semibold leading-none tracking-[-0.04em] tabular-nums sm:text-[52px]" />
              <div className="mt-1.5 text-[13px] text-muted">{s.label}</div>
            </div>
          ))}
        </Reveal>
      </div>

      <Stagger as="ol" className="mt-14 grid gap-4 md:grid-cols-3">
        <Step n={1} title="Profile" time="~8s" body="Eight probes: platform, rendering, schema, feed, robots, bot protection, checkout.">
          <ProbeArt />
        </Step>
        <Step n={2} title="Replay" time="under 2 min" body="Each buyer runs its own journey in a real browser.">
          <ReplayArt />
        </Step>
        <Step n={3} title="Fix" time="you" body="The failing step, its screenshot, and what unblocks each buyer.">
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
  { name: "ChatGPT Shopping", vendor: "OpenAI", since: "Sep 2025", buys: "Feed and product page, then Instant Checkout.", kills: "JS-only price. No feed. GPTBot blocked." },
  { name: "Grok", vendor: "xAI", buys: "Fetches product pages, pays by single-use card.", kills: "Empty HTML. robots.txt. WAF 403." },
  { name: "Perplexity search", vendor: "Perplexity", since: "Nov 2025", buys: "Crawled pages, then Instant Buy via PayPal.", kills: "PerplexityBot blocked. Challenge page." },
  { name: "Google AI Mode", vendor: "Google", since: "Jan 2026", buys: "Merchant Center data, UCP checkout.", kills: "No Product schema. Stock not readable." },
];

const BROWSER_AGENTS: Persona[] = [
  { name: "ChatGPT Atlas", vendor: "OpenAI", since: "Oct 2025", buys: "Drives Chromium: search, cart, guest checkout.", kills: "Login wall. CAPTCHA. Stuck modal." },
  { name: "Perplexity Comet", vendor: "Perplexity", since: "2025", buys: "Browses like a shopper, pays with Instant Buy.", kills: "Cloudflare challenge. Popup. Dead Add to cart." },
  { name: "Amazon Buy for Me", vendor: "Amazon", since: "Apr 2025", buys: "Buys from your site inside the Amazon app.", kills: "Account required. CAPTCHA. Rejected form." },
];

export function Buyers() {
  return (
    <Section id="buyers" className="border-t border-line bg-surface/50">
      <Heading title="Who is buying this way" lead="Feed readers fetch once, no JavaScript. Browser agents drive Chromium to checkout." />
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
  { icon: FileCode, title: "JavaScript-only rendering", check: "Seen", body: "Price appears after hydration. The fetcher sees an empty page." },
  { icon: Braces, title: "No Product JSON-LD or feed", check: "Listed", body: "Nothing machine-readable. Shopping surfaces list a competitor." },
  { icon: Ban, title: "robots.txt / bot protection", check: "Seen", body: "GPTBot disallowed, or a 403. The store reads as blank." },
  { icon: ShieldAlert, title: "CAPTCHA", check: "Buyable", body: "Checkout asks for a human. The session ends." },
  { icon: MessageSquareWarning, title: "Popups and forms", check: "Buyable", body: "A modal over Add to cart. A field with no label." },
  { icon: KeyRound, title: "Login wall", check: "Buyable", body: "Checkout wants an account. Agents shop as guests." },
];

export function Killers() {
  return (
    <Section id="killers" className="border-t border-line">
      <Heading title="Where the sale dies" lead="Six checks. Six lines in your fix list." />
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
  { row: "Runs on your live theme, not your markup", checklist: false, watchdog: true },
];

const SHOPIFY_FACTS = [
  { date: "28 May 2026", text: "Every store serves /agents.md and /llms.txt. Watchdog reads them." },
  { date: "30 May 2026", text: "Unsigned bots get the strictest rate limits. Watchdog reports your tier." },
  { date: "21 Sep 2026", text: "Shop Pay is on by default for agents. Reachability is all that is left." },
];

export function Shopify() {
  return (
    <Section id="shopify" className="border-t border-line bg-surface/50">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <Heading title="Shopify's checker says you pass. Can an agent finish checkout?" lead="Their scanner reads markup. Watchdog drives your live theme." />
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
            <p className="mt-3 text-[13px] text-muted">Also WooCommerce, BigCommerce, Magento and custom stores.</p>
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
          <h2 className="text-[36px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[56px]">See where AI buyers stop on your store.</h2>
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
        <p className="text-muted">Free during beta. Paid monitoring later.</p>
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
