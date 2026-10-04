import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/sections";
import { RunView } from "@/app/dashboard/[id]/run-view";

export const metadata: Metadata = {
  title: "Sample report · AI Buyer Watchdog",
  description: "A finished Watchdog audit of the demo store in broken mode: the issues AI buyers hit, the evidence for each, and how to fix them.",
};

export default function DemoReportPage() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Logo />
            <span className="hidden text-line-strong sm:inline" aria-hidden>
              /
            </span>
            <span className="truncate text-[13.5px] text-ink-2">Sample report · demo store (broken mode)</span>
          </div>
          <Link
            href="/#audit"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-[13.5px] font-medium text-accent-ink transition-opacity hover:opacity-90"
          >
            Run this on your store
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </header>
      <div className="flex-1">
        <RunView id="demo" mode="demo" endpoint="/api/public/demo-run" back={{ href: "/", label: "Back to Watchdog" }} />
      </div>
      <Footer />
    </>
  );
}
