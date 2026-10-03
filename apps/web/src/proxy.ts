import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import type { AgentHitKind } from "@watchdog/db";
import { WAF_UA_PATTERN } from "@/lib/bench";
import { hitFromRequest, logHit } from "@/lib/bench-log";

function benchKind(pathname: string): AgentHitKind | null {
  if (pathname === "/robots.txt") return "robots";
  if (pathname === "/bench" || pathname.startsWith("/bench/")) return "page";
  // The beacon route logs itself with the posted payload.
  if (pathname === "/api/bench/beacon") return null;
  if (pathname.startsWith("/api/bench/")) return "api";
  return null;
}

function isBenchPath(pathname: string) {
  return pathname === "/robots.txt" || pathname === "/bench" || pathname.startsWith("/bench/") || pathname.startsWith("/api/bench/");
}

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname, search } = request.nextUrl;

  if (isBenchPath(pathname)) {
    const blocked =
      (pathname === "/bench/bot-403" || pathname.startsWith("/bench/bot-403/")) &&
      WAF_UA_PATTERN.test(request.headers.get("user-agent") ?? "");
    const kind = benchKind(pathname);
    if (kind) event.waitUntil(logHit(hitFromRequest(request, kind, blocked ? { note: "waf-403" } : {})));
    if (blocked) return new NextResponse("Access denied", { status: 403, headers: { "content-type": "text/plain" } });
    return NextResponse.next();
  }

  if (getSessionCookie(request)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/runs/:path*", "/bench", "/bench/:path*", "/api/bench/:path*", "/robots.txt"],
};
