"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cartCookie, getBenchCase } from "@/lib/bench";

async function setCart(id: string) {
  const c = getBenchCase(id);
  if (!c) throw new Error("unknown case");
  (await cookies()).set(cartCookie(c.id), "1", { path: `/bench/${c.id}`, sameSite: "lax", maxAge: 60 * 60 * 24 });
  return c.id;
}

export async function addToCart(id: string) {
  const caseId = await setCart(id);
  redirect(`/bench/${caseId}/cart`);
}

export async function addToCartQuiet(id: string) {
  await setCart(id);
}

export async function continueToPayment(id: string) {
  const c = getBenchCase(id);
  if (!c) throw new Error("unknown case");
  redirect(`/bench/${c.id}/payment`);
}

export async function signInAttempt(id: string) {
  const c = getBenchCase(id);
  if (!c) throw new Error("unknown case");
  redirect(`/bench/${c.id}/checkout?error=invalid`);
}
