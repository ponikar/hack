import { parseMode, PRODUCT } from "@/lib/store";
import Link from "next/link";

export default async function CartPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const mode = parseMode((await searchParams).mode);
  return (
    <main className="p-8 space-y-4">
      <h1 className="text-2xl">Cart</h1>
      <div>{PRODUCT.name} × 1 — £{(PRODUCT.price / 100).toFixed(2)}</div>
      <Link href={`/store/checkout?mode=${mode}`} className="inline-block bg-black text-white px-4 py-2" data-testid="checkout">
        Checkout
      </Link>
    </main>
  );
}
