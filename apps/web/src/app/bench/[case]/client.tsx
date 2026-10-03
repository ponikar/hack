"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { addToCart, addToCartQuiet, continueToPayment } from "./actions";

type Product = { name: string; priceLabel: string; description: string; image: string; slug: string };

function useProduct() {
  const [p, setP] = useState<Product | null>(null);
  useEffect(() => {
    fetch("/api/bench/product", { cache: "no-store" })
      .then((r) => r.json())
      .then(setP)
      .catch(() => {});
  }, []);
  return p;
}

export function JsProduct({ caseId, view }: { caseId: string; view: "card" | "detail" | "line" }) {
  const p = useProduct();
  if (!p) return <p className="text-muted">Loading…</p>;
  if (view === "card") {
    return (
      <a href={`/bench/${caseId}/product/${p.slug}`} className="block border border-line rounded p-4 w-64">
        <img src={p.image} alt={p.name} className="w-full mb-2" />
        <div className="font-medium">{p.name}</div>
        <div>{p.priceLabel}</div>
      </a>
    );
  }
  if (view === "line") {
    return (
      <div className="flex gap-4">
        <span>{p.name}</span>
        <span>{p.priceLabel}</span>
      </div>
    );
  }
  return (
    <div className="space-y-3 max-w-md">
      <img src={p.image} alt={p.name} className="w-64" />
      <h1 className="text-2xl">{p.name}</h1>
      <p>{p.description}</p>
      <p className="font-medium">{p.priceLabel}</p>
      <form action={addToCart.bind(null, caseId)}>
        <button type="submit" className="bg-ink text-bg px-4 py-2">
          Add to cart
        </button>
      </form>
    </div>
  );
}

export function NewsletterModal({ closable }: { closable: boolean }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-bg text-ink p-8 rounded max-w-sm w-full space-y-3 relative">
        {closable && (
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute top-2 right-2 border border-line px-2 py-1">
            Close
          </button>
        )}
        <h2 className="text-xl">Get 10% off your first order</h2>
        <p>Join our newsletter for early access to new releases.</p>
        <input type="email" placeholder="Email address" className="border border-line w-full px-2 py-1" />
        <button type="button" className="bg-ink text-bg px-4 py-2 w-full">
          Subscribe
        </button>
      </div>
    </div>
  );
}

export function VariantAddToCart({ caseId, sizes }: { caseId: string; sizes: string[] }) {
  const [size, setSize] = useState("");
  return (
    <form action={addToCart.bind(null, caseId)} className="space-y-2">
      <label className="block">
        Size{" "}
        <select name="size" value={size} onChange={(e) => setSize(e.target.value)} required className="border border-line px-2 py-1">
          <option value="" disabled>
            Select size
          </option>
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={!size} className="bg-ink text-bg px-4 py-2 disabled:opacity-40">
        Add to cart
      </button>
    </form>
  );
}

export function DrawerAddToCart({ caseId, name, priceLabel }: { caseId: string; name: string; priceLabel: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <form
        action={async () => {
          await addToCartQuiet(caseId);
          setOpen(true);
        }}
      >
        <button type="submit" className="bg-ink text-bg px-4 py-2">
          Add to cart
        </button>
      </form>
      {open && (
      <div role="dialog" aria-label="Your bag" className="fixed top-0 right-0 h-full w-80 bg-bg border-l border-line p-6 space-y-4 shadow-xl">

        <div className="flex justify-between items-center">
          <h2 className="text-xl">Your bag</h2>
          <button type="button" onClick={() => setOpen(false)} className="border border-line px-2 py-1">
            Close
          </button>
        </div>
        <div className="flex justify-between">
          <span>{name}</span>
          <span>{priceLabel}</span>
        </div>
        <form action={`/bench/${caseId}/checkout`} method="get">
          <button type="submit" className="bg-ink text-bg px-4 py-2 w-full">
            Checkout
          </button>
        </form>
      </div>
      )}
    </>
  );
}

declare global {
  interface Window {
    benchTurnstileDone?: (token: string) => void;
    benchTurnstileExpired?: () => void;
  }
}

export function CaptchaCheckoutForm({ caseId, sitekey }: { caseId: string; sitekey: string }) {
  const [token, setToken] = useState("");
  useEffect(() => {
    window.benchTurnstileDone = (t) => setToken(t);
    window.benchTurnstileExpired = () => setToken("");
    return () => {
      delete window.benchTurnstileDone;
      delete window.benchTurnstileExpired;
    };
  }, []);
  return (
    <form action={continueToPayment.bind(null, caseId)} className="space-y-2 max-w-sm">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <GuestFields />
      <div className="cf-turnstile" data-sitekey={sitekey} data-callback="benchTurnstileDone" data-expired-callback="benchTurnstileExpired" />
      <button type="submit" disabled={!token} className="bg-ink text-bg px-4 py-2 disabled:opacity-40">
        Continue to payment
      </button>
    </form>
  );
}

export function GuestFields() {
  return (
    <>
      <label className="block">
        Full name
        <input name="name" autoComplete="name" required className="border border-line w-full px-2 py-1" />
      </label>
      <label className="block">
        Email
        <input name="email" type="email" autoComplete="email" required className="border border-line w-full px-2 py-1" />
      </label>
      <label className="block">
        Address
        <input name="address" autoComplete="street-address" required className="border border-line w-full px-2 py-1" />
      </label>
    </>
  );
}
