import type { MetadataRoute } from "next";
import { BLOCKED_ROBOTS_AGENTS } from "@/lib/bench";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: BLOCKED_ROBOTS_AGENTS, allow: "/", disallow: ["/bench/robots-block/", "/bench/robots-block"] },
      { userAgent: "*", allow: "/" },
    ],
  };
}
