import { NextResponse } from "next/server";
import { BENCH_PRODUCT } from "@/lib/bench";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(BENCH_PRODUCT, { headers: { "cache-control": "no-store" } });
}
