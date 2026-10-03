import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import { cartCookie, getBenchCase, type BenchCase } from "@/lib/bench";

export async function requireCase(params: Promise<{ case: string }>): Promise<BenchCase> {
  const c = getBenchCase((await params).case);
  if (!c) notFound();
  return c;
}

export async function hasCart(id: string) {
  return (await cookies()).get(cartCookie(id))?.value === "1";
}

export async function requestOrigin() {
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}
