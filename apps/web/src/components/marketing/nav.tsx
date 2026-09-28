import Link from "next/link";
import { AuthButtons } from "@/components/auth-buttons";
import { NavChrome } from "./nav-chrome";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <rect x="1" y="1" width="20" height="20" rx="6" className="fill-ink" />
        <path d="M6 11.5l3 3L16 8" stroke="var(--bg)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16.5" cy="6" r="2.5" className="fill-fail" />
      </svg>
      Watchdog
    </Link>
  );
}

const MARKETING = [
  { href: "#demo", label: "Demo" },
  { href: "#buyers", label: "Who is shopping" },
  { href: "#killers", label: "What kills the sale" },
  { href: "#shopify", label: "Shopify" },
  { href: "#faq", label: "FAQ" },
];

export function Nav({ links = "marketing" }: { links?: "marketing" | "app" }) {
  return (
    <NavChrome solid={links === "app"}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-7">
          <Logo />
          <nav className="hidden items-center gap-5 text-[13.5px] text-ink-2 md:flex" aria-label="Main">
            {links === "marketing" ? (
              MARKETING.map((l) => (
                <a key={l.href} href={l.href} className="transition-colors hover:text-ink">
                  {l.label}
                </a>
              ))
            ) : (
              <Link href="/dashboard" className="transition-colors hover:text-ink">
                Audits
              </Link>
            )}
          </nav>
        </div>
        <AuthButtons />
      </div>
    </NavChrome>
  );
}
