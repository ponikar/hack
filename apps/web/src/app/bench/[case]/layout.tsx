import { requireCase } from "./case";

export const dynamic = "force-dynamic";

export default async function CaseLayout({ children, params }: { children: React.ReactNode; params: Promise<{ case: string }> }) {
  const c = await requireCase(params);
  const base = `/bench/${c.id}`;
  return (
    <div className="min-h-screen">
      <header className="border-b border-line p-4 flex gap-4">
        <a href={base}>Home</a>
        <a href={`${base}/search`}>Search</a>
        {c.id !== "cart-drawer" && <a href={`${base}/cart`}>Cart</a>}
      </header>
      <div className="p-8">{children}</div>
    </div>
  );
}
