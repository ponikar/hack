import { BENCH_PRODUCT } from "@/lib/bench";
import { requireCase } from "../case";
import { ProductCard, SearchBox } from "../ui";

export const dynamic = "force-dynamic";

const HAYSTACK = `${BENCH_PRODUCT.name} ${BENCH_PRODUCT.description} shoe shoes trainer trainers sneaker running`.toLowerCase();

function matches(q: string) {
  const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length >= 2);
  return terms.length > 0 && terms.some((t) => HAYSTACK.includes(t));
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ case: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const c = await requireCase(params);
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  return (
    <main className="space-y-4">
      <h1 className="text-2xl">Search</h1>
      <SearchBox caseId={c.id} q={q} />
      {q &&
        (matches(q) ? (
          <section className="space-y-2">
            <p>1 result for “{q}”</p>
            <ProductCard c={c} />
          </section>
        ) : (
          <p>No results for “{q}”</p>
        ))}
    </main>
  );
}
