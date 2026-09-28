"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
    <main className="mx-auto max-w-sm p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm">Name</span>
          <input name="name" type="text" autoComplete="name" className="w-full rounded border px-3 py-2" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm">Email</span>
          <input name="email" type="email" required autoComplete="email" className="w-full rounded border px-3 py-2" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm">Password</span>
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="w-full rounded border px-3 py-2" />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={pending} className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50">
          {pending ? "Creating account..." : "Get started"}
        </button>
      </form>
      <p className="text-sm">
        Already have an account?{" "}
        <Link className="underline" href={`/sign-in?next=${encodeURIComponent(next)}`}>
          Sign in
        </Link>
      </p>
    </main>
  );
}
