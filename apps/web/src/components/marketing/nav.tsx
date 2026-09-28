import Link from "next/link";
import { AuthButtons } from "@/components/auth-buttons";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="text-accent">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
        <path d="M6 10.5l2.5 2.5L14 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Watchdog
    </Link>
  );
}

export function Nav({ links = "marketing" }: { links?: "marketing" | "app" }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-5 text-sm text-ink-2 md:flex" aria-label="Main">
            {links === "marketing" ? (
              <>
                <a href="#how" className="hover:text-ink">How it works</a>
                <a href="#buyers" className="hover:text-ink">Who&apos;s shopping</a>
                <a href="#killers" className="hover:text-ink">What kills the sale</a>
              </>
            ) : (
              <Link href="/dashboard" className="hover:text-ink">Audits</Link>
            )}
          </nav>
        </div>
        <AuthButtons />
      </div>
    </header>
  );
}
