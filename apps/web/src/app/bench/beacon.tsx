"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function Beacon() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const benchCase = pathname.match(/^\/bench\/([^/]+)/)?.[1] ?? null;
      void fetch("/api/bench/beacon", {
        method: "POST",
        keepalive: true,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          case: benchCase,
          path: pathname + window.location.search,
          ua: navigator.userAgent,
          webdriver: navigator.webdriver ?? null,
          viewport: { w: window.innerWidth, h: window.innerHeight },
        }),
      }).catch(() => {});
    } catch {}
  }, [pathname]);
  return null;
}
