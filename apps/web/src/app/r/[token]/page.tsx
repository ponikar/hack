import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/marketing/nav";
import { RunView } from "@/app/dashboard/[id]/run-view";

export const metadata: Metadata = {
  title: "Shared AI-buyer audit · AI Buyer Watchdog",
  description: "What breaks when AI shopping agents try to find and buy from this store, with evidence and fixes.",
  robots: { index: false, follow: false },
};

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Logo />
            <span className="hidden truncate text-[13.5px] text-muted sm:inline">Shared AI-buyer audit</span>
          </div>
          <Link
            href="/"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-ink px-3 text-[13px] font-medium text-bg hover:opacity-90"
          >
            <span className="sm:hidden">Run your own</span>
            <span className="hidden sm:inline">Run your own free audit</span>
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </header>
      <div className="flex-1">
        <RunView id={token} mode="public" endpoint={`/api/public/report/${encodeURIComponent(token)}`} shareToken={token} back={null} />
      </div>
    </>
  );
}
