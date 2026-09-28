"use client";

import Link from "next/link";

// Placeholder. The auth integration replaces this with session-aware buttons.
export function AuthButtons() {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/sign-in">Sign in</Link>
      <Link href="/dashboard" className="rounded-md bg-black px-3 py-1.5 text-white">Dashboard</Link>
    </div>
  );
}
