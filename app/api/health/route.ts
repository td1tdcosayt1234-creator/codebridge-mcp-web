import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { remoteStatus } from "@/lib/remotedb";

// Must run per-request: reports live uptime + active db mode (never prerender).
export const dynamic = "force-dynamic";

// Public liveness + dependency check (no secrets). For uptime monitors.
export async function GET() {
  const started = (globalThis as any).__bootAt || ((globalThis as any).__bootAt = Date.now());
  try {
    await readDb(); // throws when the database is corrupt/unreadable
    const rs = remoteStatus();
    return NextResponse.json({
      ok: true,
      uptimeSec: Math.floor((Date.now() - started) / 1000),
      time: new Date().toISOString(),
      db: { mode: rs.enabled ? "firebase" : "local", path: rs.path || undefined },
      billing: {
        configured: (process.env.PADDLE_API_KEY || "").startsWith("pdl_") && !!process.env.PADDLE_PRO_PRICE_ID && !!process.env.PADDLE_TEAM_PRICE_ID,
        webhookSet: !!process.env.PADDLE_WEBHOOK_SECRET,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "db unreadable" }, { status: 500 });
  }
}
