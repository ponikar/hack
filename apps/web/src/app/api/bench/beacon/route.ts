import { NextResponse, after, type NextRequest } from "next/server";
import { hitFromRequest, logHit } from "@/lib/bench-log";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {}
  const benchCase = typeof body.case === "string" ? body.case.slice(0, 64) : null;
  const path = typeof body.path === "string" ? body.path.slice(0, 512) : request.nextUrl.pathname;
  const note = JSON.stringify({
    ua: body.ua,
    webdriver: body.webdriver,
    viewport: body.viewport,
  }).slice(0, 2000);
  after(() => logHit(hitFromRequest(request, "beacon", { benchCase, path, note })));
  return new NextResponse(null, { status: 204 });
}
