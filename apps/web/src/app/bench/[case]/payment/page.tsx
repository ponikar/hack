import { requireCase } from "../case";

export const dynamic = "force-dynamic";

export default async function PaymentPage({ params }: { params: Promise<{ case: string }> }) {
  await requireCase(params);
  return (
    <main>
      <h1 className="text-2xl" data-testid="payment-step">
        Payment step
      </h1>
    </main>
  );
}
