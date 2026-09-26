import { parseMode, PRODUCT } from "@/lib/store";
import { ClientProduct } from "./client-product";
import Link from "next/link";

export default async function StoreHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const mode = parseMode((await searchParams).mode);
  return (
    <main className="p-8">
      <h1 className="text-2xl mb-4">Demo Store <span className="text-xs border px-1">{mode}</span></h1>
      {mode === "broken" ? (
        <ClientProduct mode={mode} detail={false} />
      ) : (
        <Link href={`/store/product/${PRODUCT.slug}?mode=${mode}`} className="block border rounded p-4 w-64">
          <div className="font-medium">{PRODUCT.name}</div>
          <div>£{(PRODUCT.price / 100).toFixed(2)}</div>
        </Link>
      )}
    </main>
  );
}
