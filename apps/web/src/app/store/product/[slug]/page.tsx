import { headers } from "next/headers";
import { parseMode, PRODUCT, productJsonLd } from "@/lib/store";
import { ClientProduct } from "../../client-product";
import Link from "next/link";

export default async function ProductPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const mode = parseMode((await searchParams).mode);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  if (mode === "broken") {
    return (
      <main className="p-8">
        <ClientProduct mode={mode} detail />
      </main>
    );
  }

  return (
    <main className="p-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(origin)) }} />
      <div className="space-y-3 max-w-md">
        <h1 className="text-2xl">{PRODUCT.name}</h1>
        <p>{PRODUCT.description}</p>
        <p className="font-medium">£{(PRODUCT.price / 100).toFixed(2)}</p>
        <Link href={`/store/cart?mode=${mode}`} className="inline-block bg-black text-white px-4 py-2" data-testid="add-to-cart">
          Add to cart
        </Link>
      </div>
    </main>
  );
}
