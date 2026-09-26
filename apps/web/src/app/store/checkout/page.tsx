import { parseMode } from "@/lib/store";
import { NewsletterPopup } from "../popup";
import { CheckoutForm } from "./form";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const mode = parseMode((await searchParams).mode);
  return (
    <main className="p-8 space-y-4">
      <h1 className="text-2xl">Checkout</h1>
      {mode === "broken" && <NewsletterPopup />}
      <CheckoutForm forceLogin={mode === "broken"} />
    </main>
  );
}
