"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell, buttonClass, fieldClass, labelClass } from "@/components/auth/auth-shell";
import { signUp } from "@/lib/auth-client";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpForm() {
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
    const email = String(form.get("email"));
    const { error } = await signUp.email({
      name: String(form.get("name") || email.split("@")[0]),
      email,
      password: String(form.get("password")),
    });
    setPending(false);
    if (error) return setError(error.message ?? "Sign up failed");
    router.push(next);
    router.refresh();
  }

  return (
    <AuthShell title="Create an account" subtitle="Free while in beta. No card needed.">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className={labelClass}>Name</span>
          <input name="name" type="text" autoComplete="name" className={fieldClass} />
        </label>
        <label className="block space-y-1">
          <span className={labelClass}>Email</span>
          <input name="email" type="email" required autoComplete="email" className={fieldClass} />
        </label>
        <label className="block space-y-1">
          <span className={labelClass}>Password</span>
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} />
        </label>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Creating account..." : "Get started"}
        </button>
      </form>
      <p className="mt-4 text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link className="font-medium text-[var(--accent)] hover:underline" href={`/sign-in?next=${encodeURIComponent(next)}`}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
