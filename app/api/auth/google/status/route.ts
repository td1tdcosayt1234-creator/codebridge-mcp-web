import { NextResponse } from "next/server";
import { googleConfigured } from "@/lib/google";

export const dynamic = "force-dynamic";

// Public: does the server have Google login env configured? (no secrets leaked)
export async function GET() {
  return NextResponse.json({ ok: true, google: googleConfigured() });
}
