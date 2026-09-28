"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell, buttonClass, fieldClass, labelClass } from "@/components/auth/auth-shell";
import { signIn } from "@/lib/auth-client";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const { error } = await signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setPending(false);
    if (error) return setError(error.message ?? "Sign in failed");
    router.push(next);
    router.refresh();
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see your audits.">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className={labelClass}>Email</span>
          <input name="email" type="email" required autoComplete="email" className={fieldClass} />
        </label>
        <label className="block space-y-1">
          <span className={labelClass}>Password</span>
          <input name="password" type="password" required autoComplete="current-password" className={fieldClass} />
        </label>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-[var(--muted)]">
        No account?{" "}
        <Link className="font-medium text-[var(--accent)] hover:underline" href={`/sign-up?next=${encodeURIComponent(next)}`}>
          Get started
        </Link>
      </p>
    </AuthShell>
  );
}
