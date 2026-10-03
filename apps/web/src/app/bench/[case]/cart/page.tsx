import { BENCH_PRODUCT } from "@/lib/bench";
import { hasCart, requireCase } from "../case";
import { JsProduct } from "../client";
import { CheckoutButton } from "../ui";

export const dynamic = "force-dynamic";

export default async function CartPage({ params }: { params: Promise<{ case: string }> }) {
  const c = await requireCase(params);
  const filled = await hasCart(c.id);
  return (
    <main className="space-y-4 max-w-md">
      <h1 className="text-2xl">Your cart</h1>
      {filled ? (
        c.id === "js-only" ? (
          <JsProduct caseId={c.id} view="line" />
        ) : (
          <div className="flex gap-4">
            <span>{BENCH_PRODUCT.name}</span>
            <span>{BENCH_PRODUCT.priceLabel}</span>
          </div>
        )
      ) : (
        <p>Your cart is empty.</p>
      )}
      <CheckoutButton c={c} />
    </main>
  );
}
