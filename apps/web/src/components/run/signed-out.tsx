import Link from "next/link";

export function SignedOut({ what = "your audits" }: { what?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-6 text-center">
      <p className="text-sm text-ink-2">Sign in to see {what}.</p>
      <Link
        href="/sign-in"
        className="mt-3 inline-flex h-9 items-center rounded-md bg-ink px-4 text-sm font-medium text-bg hover:opacity-90"
      >
        Sign in
      </Link>
    </div>
  );
}
