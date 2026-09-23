import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

// Public liveness + dependency check (no secrets). For uptime monitors.
export async function GET() {
  const started = (globalThis as any).__bootAt || ((globalThis as any).__bootAt = Date.now());
  try {
    const db = await readDb();
    return NextResponse.json({
      ok: true,
      uptimeSec: Math.floor((Date.now() - started) / 1000),
      time: new Date().toISOString(),
      db: { users: db.users.length, tasks: db.tasks.length },
      billing: {
        configured: (process.env.PADDLE_API_KEY || "").startsWith("pdl_") && !!process.env.PADDLE_PRO_PRICE_ID && !!process.env.PADDLE_TEAM_PRICE_ID,
        webhookSet: !!process.env.PADDLE_WEBHOOK_SECRET,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "db unreadable" }, { status: 500 });
  }
}
