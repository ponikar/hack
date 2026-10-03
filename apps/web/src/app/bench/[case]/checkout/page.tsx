import { BENCH_PRODUCT } from "@/lib/bench";
import { continueToPayment, signInAttempt } from "../actions";
import { hasCart, requireCase } from "../case";
import { CaptchaCheckoutForm, GuestFields, JsProduct } from "../client";

export const dynamic = "force-dynamic";

const TURNSTILE_ALWAYS_INTERACTIVE = "3x00000000000000000000FF";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ case: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const c = await requireCase(params);
  const filled = await hasCart(c.id);

  if (c.id === "login-wall") {
    const error = (await searchParams).error;
    return (
      <main className="space-y-4 max-w-sm">
        <h1 className="text-2xl">Sign in to check out</h1>
        {error && <p className="text-fail">Invalid email or password.</p>}
        <form action={signInAttempt.bind(null, c.id)} className="space-y-2">
          <label className="block">
            Email
            <input name="email" type="email" autoComplete="username" required className="border border-line w-full px-2 py-1" />
          </label>
          <label className="block">
            Password
            <input name="password" type="password" autoComplete="current-password" required className="border border-line w-full px-2 py-1" />
          </label>
          <button type="submit" className="bg-ink text-bg px-4 py-2">
            Sign in
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="space-y-4 max-w-sm">
      <h1 className="text-2xl">Checkout</h1>
      {filled &&
        (c.id === "js-only" ? (
          <JsProduct caseId={c.id} view="line" />
        ) : (
          <div className="flex gap-4">
            <span>{BENCH_PRODUCT.name}</span>
            <span>{BENCH_PRODUCT.priceLabel}</span>
          </div>
        ))}
      <p className="text-muted">Guest checkout</p>
      {c.id === "captcha" ? (
        <CaptchaCheckoutForm caseId={c.id} sitekey={TURNSTILE_ALWAYS_INTERACTIVE} />
      ) : (
        <form action={continueToPayment.bind(null, c.id)} className="space-y-2" data-testid="checkout-form">
          <GuestFields />
          <button type="submit" className="bg-ink text-bg px-4 py-2">
            Continue to payment
          </button>
        </form>
      )}
    </main>
  );
}
