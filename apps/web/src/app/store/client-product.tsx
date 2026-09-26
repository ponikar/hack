"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Product = { slug: string; name: string; price: number; description: string };

// Simulates a JS-only storefront: product data only exists after client fetch.
export function ClientProduct({ mode, detail }: { mode: string; detail: boolean }) {
  const [p, setP] = useState<Product | null>(null);
  useEffect(() => {
    fetch("/api/store/product").then((r) => r.json()).then(setP);
  }, []);
  if (!p) return <div id="root" />;

  if (!detail) {
    return (
      <Link href={`/store/product/${p.slug}?mode=${mode}`} className="block border rounded p-4 w-64">
        <div className="font-medium">{p.name}</div>
        <div>£{(p.price / 100).toFixed(2)}</div>
      </Link>
    );
  }
  return (
    <div className="space-y-3 max-w-md">
      <h1 className="text-2xl">{p.name}</h1>
      <p>{p.description}</p>
      <p className="font-medium">£{(p.price / 100).toFixed(2)}</p>
      <Link href={`/store/cart?mode=${mode}`} className="inline-block bg-black text-white px-4 py-2" data-testid="add-to-cart">
        Add to cart
      </Link>
    </div>
  );
}
