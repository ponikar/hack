import { notFound } from "next/navigation";
import { BENCH_PRODUCT, BENCH_SIZES, benchJsonLd } from "@/lib/bench";
import { addToCart } from "../../actions";
import { requireCase, requestOrigin } from "../../case";
import { DrawerAddToCart, JsProduct, NewsletterModal, VariantAddToCart } from "../../client";
import { BagIcon } from "../../ui";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ case: string; slug: string }> }) {
  const c = await requireCase(params);
  if ((await params).slug !== BENCH_PRODUCT.slug) notFound();

  if (c.id === "js-only") {
    return (
      <main>
        <JsProduct caseId={c.id} view="detail" />
      </main>
    );
  }

  const origin = await requestOrigin();
  const withSchema = c.id !== "no-schema";

  let addControl: React.ReactNode;
  if (c.id === "variant-required") {
    addControl = <VariantAddToCart caseId={c.id} sizes={BENCH_SIZES} />;
  } else if (c.id === "cart-drawer") {
    addControl = <DrawerAddToCart caseId={c.id} name={BENCH_PRODUCT.name} priceLabel={BENCH_PRODUCT.priceLabel} />;
  } else {
    addControl = (
      <form action={addToCart.bind(null, c.id)}>
        {c.id === "icon-buttons" ? (
          <button type="submit" className="bg-ink text-bg p-2">
            <BagIcon />
          </button>
        ) : (
          <button type="submit" className="bg-ink text-bg px-4 py-2">
            Add to cart
          </button>
        )}
      </form>
    );
  }

  return (
    <main>
      {withSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(benchJsonLd(origin, c.id)) }} />}
      <div className="space-y-3 max-w-md">
        <img src={BENCH_PRODUCT.image} alt={BENCH_PRODUCT.name} className="w-64" />
        <h1 className="text-2xl">{BENCH_PRODUCT.name}</h1>
        <p>{BENCH_PRODUCT.description}</p>
        <p className="font-medium">{BENCH_PRODUCT.priceLabel}</p>
        {addControl}
      </div>
      {(c.id === "popup-trap" || c.id === "popup-closable") && <NewsletterModal closable={c.id === "popup-closable"} />}
    </main>
  );
}
