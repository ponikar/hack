import type { StoreMode } from "@watchdog/shared";

export const PRODUCT = {
  slug: "watchdog-hoodie",
  name: "Watchdog Hoodie",
  price: 4900,
  currency: "GBP",
  sku: "WD-HOODIE-001",
  description: "Heavyweight organic cotton hoodie. Unisex fit, embroidered logo.",
  image: "/hoodie.svg",
};

export function parseMode(v: string | string[] | undefined): StoreMode {
  return v === "fixed" ? "fixed" : "broken";
}

export function productJsonLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: PRODUCT.name,
    sku: PRODUCT.sku,
    description: PRODUCT.description,
    image: `${origin}${PRODUCT.image}`,
    offers: {
      "@type": "Offer",
      price: (PRODUCT.price / 100).toFixed(2),
      priceCurrency: PRODUCT.currency,
      availability: "https://schema.org/InStock",
      url: `${origin}/store/product/${PRODUCT.slug}`,
    },
  };
}
