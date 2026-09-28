"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";

export function AuthButtons() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  if (isPending) return <div className="h-9" />;

  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/sign-in" className="rounded px-3 py-2 text-sm underline">
          Sign in
        </Link>
        <Link href="/sign-up" className="rounded bg-black px-3 py-2 text-sm text-white">
          Get started
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">{session.user.email}</span>
      <Link href="/dashboard" className="rounded px-3 py-2 text-sm underline">
        Dashboard
      </Link>
      <button
        type="button"
        onClick={async () => {
          await signOut();
          router.push("/");
          router.refresh();
        }}
        className="rounded border px-3 py-2 text-sm"
      >
        Sign out
      </button>
    </div>
  );
}
