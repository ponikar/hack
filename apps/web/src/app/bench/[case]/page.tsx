import { requireCase } from "./case";
import { ProductCard, SearchBox } from "./ui";

export const dynamic = "force-dynamic";

export default async function CaseHome({ params }: { params: Promise<{ case: string }> }) {
  const c = await requireCase(params);
  return (
    <main className="space-y-4">
      <h1 className="text-2xl">Peak Outfitters</h1>
      {c.id === "search-only" ? <SearchBox caseId={c.id} /> : <ProductCard c={c} />}
    </main>
  );
}
