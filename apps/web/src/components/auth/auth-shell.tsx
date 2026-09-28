import Link from "next/link";
import { Logo } from "@/components/marketing/nav";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="Watchdog home">
            <Logo />
          </Link>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}

export const fieldClass =
  "w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] dark:border-white/15";
export const labelClass = "text-sm font-medium";
export const buttonClass =
  "w-full rounded-lg bg-[var(--accent)] px-3 py-2.5 text-sm font-medium text-[var(--accent-ink)] transition hover:opacity-90 disabled:opacity-50";
