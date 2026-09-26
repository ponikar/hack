import { NextResponse } from "next/server";
import { PRODUCT } from "@/lib/store";

export function GET() {
  return NextResponse.json(PRODUCT);
}
