import { DEMO_STORE_BROKEN } from "@/lib/demo";
import Link from "next/link";
import { Braces, FileCode2, Lock, MessageSquareWarning, ShieldAlert, Bot, Radar, MousePointerClick, Wrench } from "lucide-react";
import { Nav, Logo } from "@/components/marketing/nav";
import { UrlForm } from "@/components/marketing/url-form";
import { HeroMock } from "@/components/marketing/hero-mock";

const STEPS = [
  {
    icon: Radar,
    title: "Profile",
    body: "Eight parallel probes read your store the way a crawler does: platform, JavaScript-only rendering, Product schema, feeds, robots.txt, bot protection, popups, cart and checkout shape.",
    time: "about 8 seconds",
  },
  {
    icon: MousePointerClick,
    title: "Replay",
    body: "Each AI buyer gets the shopping journey it would really attempt. Feed readers fetch without JavaScript. Browser agents drive a real Chromium through search, cart and guest checkout, and stop at the payment step.",
    time: "under 2 minutes",
  },
  {
    icon: Wrench,
    title: "Fix",
    body: "You get the exact step where each buyer died, the screenshot, the plain-English reason, and a fix list grouped by what it unblocks.",
    time: "your move",
  },
];

const FEED_READERS = [
  { name: "ChatGPT Shopping", by: "OpenAI" },
  { name: "Grok", by: "xAI" },
  { name: "Perplexity search", by: "Perplexity" },
  { name: "Google AI Mode", by: "Google" },
];

const BROWSER_AGENTS = [
  { name: "ChatGPT Atlas", by: "OpenAI, agent mode" },
  { name: "Perplexity Comet", by: "Perplexity" },
  { name: "Amazon Buy for Me", by: "Amazon" },
];

const KILLERS = [
  {
    icon: FileCode2,
    title: "JavaScript-only pages",
    body: "Feed readers never run your JavaScript. If price and stock only exist after hydration, they see an empty page.",
    kills: "Feed readers",
  },
  {
    icon: Braces,
    title: "Missing Product schema",
    body: "No schema.org Product JSON-LD or feed means shopping systems have nothing to list. You are not in the results.",
    kills: "Feed readers",
  },
  {
    icon: MessageSquareWarning,
    title: "Popups",
    body: "A newsletter or consent modal with no real close button sits on top of Add to cart. The agent clicks, nothing happens, it gives up.",
    kills: "Browser agents",
  },
  {
    icon: Lock,
    title: "Login walls",
    body: "Agents shop as guests. A forced account at checkout ends the purchase one step from payment.",
    kills: "Browser agents",
  },
  {
    icon: ShieldAlert,
    title: "CAPTCHA",
    body: "Around 40% of agent checkouts die on a challenge. Invisible checks or an allowlist for signed agents keep the sale.",
    kills: "Browser agents",
  },
  {
    icon: Bot,
    title: "robots.txt",
    body: "Disallow GPTBot, ClaudeBot or PerplexityBot and those assistants never learn your catalogue exists.",
    kills: "Feed readers",
  },
];

export default function Home() {
  return (
    <>
      <Nav />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
          <div className="max-w-3xl">
            <h1 className="text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
              Uptime monitoring,
              <br />
              but for AI buyers.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
              An AI mystery shopper for your store. Enter a URL and Watchdog replays the shopping journeys ChatGPT, Perplexity, Grok,
              Google and Amazon&apos;s agents would attempt, shows the exact step where each one dies, and tells you what to fix.
            </p>
            <div className="mt-8">
              <UrlForm />
            </div>
            <p className="mt-3 text-sm text-muted">
              Read-only on live stores. Agents stop at the payment step; nothing is bought.
            </p>
          </div>

          <div className="mt-12 sm:mt-16">
            <HeroMock />
          </div>
        </section>

        <section id="how" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">One URL in. A fix list out.</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative border-t border-line-strong pt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <s.icon className="size-5 text-accent" strokeWidth={1.75} aria-hidden />
                      <span className="text-lg font-semibold">
                        {i + 1}. {s.title}
                      </span>
                    </div>
                    <span className="text-xs text-muted">{s.time}</span>
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="buyers" className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Seven buyers. Two ways of shopping.</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                Every AI buyer on the market is one of two archetypes. Watchdog replays both, so a fix for one is checked against the
                rest.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <PersonaGroup
                title="Feed readers"
                body="Read your product page without JavaScript. Pick products from feeds and schema. Hand the buyer off to your checkout."
                dies="Die on JavaScript-only prices, missing schema, robots.txt and WAF blocks."
                people={FEED_READERS}
              />
              <PersonaGroup
                title="Browser agents"
                body="Drive a real browser through search, product, cart and guest checkout on the buyer's behalf. Stop at the payment step."
                dies="Die on CAPTCHA, login walls, popups and bot protection."
                people={BROWSER_AGENTS}
              />
            </div>
          </div>
        </section>

        <section id="killers" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">What kills the sale</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                Six things a human shopper walks past and an AI buyer cannot. Each one is a check in the audit and a line in the fix
                list.
              </p>
            </div>
            <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {KILLERS.map((k) => (
                <li key={k.title} className="bg-bg p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <k.icon className="size-5 text-fail" strokeWidth={1.75} aria-hidden />
                    <span className="text-xs text-muted">Kills {k.kills.toLowerCase()}</span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{k.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{k.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Find out where AI buyers give up on your store.</h2>
            <div className="mt-6">
              <UrlForm size="md" />
            </div>
            <p className="mt-3 text-sm text-muted">
              No store yet?{" "}
              <Link href={`/dashboard/new?url=${encodeURIComponent(DEMO_STORE_BROKEN)}`} className="text-accent hover:underline">
                Audit the demo store
              </Link>{" "}
              and watch it fail.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-muted">Uptime monitoring, but for AI buyers.</span>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-ink-2" aria-label="Footer">
            <Link href="/dashboard" className="hover:text-ink">Dashboard</Link>
            <Link href="/store?mode=broken" className="hover:text-ink">Demo store</Link>
            <a href="#how" className="hover:text-ink">How it works</a>
          </nav>
        </div>
      </footer>
    </>
  );
}

function PersonaGroup({
  title,
  body,
  dies,
  people,
}: {
  title: string;
  body: string;
  dies: string;
  people: { name: string; by: string }[];
}) {
  return (
    <div className="rounded-xl border border-line bg-bg p-5 sm:p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{body}</p>
      <p className="mt-2 text-sm text-fail">{dies}</p>
      <ul className="mt-5 divide-y divide-line border-t border-line">
        {people.map((p) => (
          <li key={p.name} className="flex items-baseline justify-between py-2.5">
            <span className="text-sm font-medium">{p.name}</span>
            <span className="text-xs text-muted">{p.by}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
