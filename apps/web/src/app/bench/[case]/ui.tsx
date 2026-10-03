import { BENCH_PRODUCT, type BenchCase } from "@/lib/bench";
import { JsProduct } from "./client";

export function BagIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" focusable="false">
      <path d="M6 7h12l1 13H5L6 7z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" focusable="false">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function ProductCard({ c }: { c: BenchCase }) {
  if (c.id === "js-only") return <JsProduct caseId={c.id} view="card" />;
  return (
    <a href={`/bench/${c.id}/product/${BENCH_PRODUCT.slug}`} className="block border border-line rounded p-4 w-64">
      <img src={BENCH_PRODUCT.image} alt={BENCH_PRODUCT.name} className="w-full mb-2" />
      <div className="font-medium">{BENCH_PRODUCT.name}</div>
      <div>{BENCH_PRODUCT.priceLabel}</div>
    </a>
  );
}

export function SearchBox({ caseId, q = "" }: { caseId: string; q?: string }) {
  return (
    <form action={`/bench/${caseId}/search`} method="get" role="search" className="flex gap-2">
      <input type="search" name="q" defaultValue={q} placeholder="Search products" aria-label="Search products" className="border border-line px-2 py-1" />
      <button type="submit" className="border border-line px-3 py-1">
        Search
      </button>
    </form>
  );
}

export function CheckoutButton({ c }: { c: BenchCase }) {
  return (
    <form action={`/bench/${c.id}/checkout`} method="get">
      {c.id === "icon-buttons" ? (
        <button type="submit" className="bg-ink text-bg p-2">
          <ArrowIcon />
        </button>
      ) : (
        <button type="submit" className="bg-ink text-bg px-4 py-2">
          Checkout
        </button>
      )}
    </form>
  );
}
