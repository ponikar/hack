import { BENCH_CASES } from "@/lib/bench";

export const dynamic = "force-dynamic";

export default function BenchIndex() {
  return (
    <main className="p-8 max-w-4xl">
      <h1 className="text-2xl mb-2">Benchmark fixture stores</h1>
      <p className="text-muted mb-6">Each store has exactly one deliberate defect.</p>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b border-line">
            <th className="py-2 pr-4">Case</th>
            <th className="py-2 pr-4">Defect</th>
            <th className="py-2 pr-4">Feed reader</th>
            <th className="py-2 pr-4">Browser agent</th>
          </tr>
        </thead>
        <tbody>
          {BENCH_CASES.map((c) => (
            <tr key={c.id} className="border-b border-line align-top">
              <td className="py-2 pr-4">
                <a className="underline" href={`/bench/${c.id}`}>
                  {c.id}
                </a>
              </td>
              <td className="py-2 pr-4">{c.defect}</td>
              <td className="py-2 pr-4">{c.expected.feedReader}</td>
              <td className="py-2 pr-4">
                {c.expected.browserAgent}
                {c.expected.blockedAt ? ` at ${c.expected.blockedAt}` : ""}
                {c.uncertain ? " (uncertain)" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
