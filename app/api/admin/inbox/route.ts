import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt, validSession } from "@/lib/auth";
import { fetchInbox } from "@/lib/elsemail";

export const dynamic = "force-dynamic";

// Admin inbox: latest mails via elsemail console API (API key stays server-side).
export async function GET() {
  const t = cookies().get("session")?.value || "";
  const p = validSession(await verifyJwt(t));
  if (!p || p.role !== "admin") return NextResponse.json({ error: "admin only" }, { status: 403 });
  const r = await fetchInbox();
  if (!r.ok) return NextResponse.json({ error: r.error || "Inbox unavailable." }, { status: 502 });
  return NextResponse.json({ ok: true, mails: r.mails || [] });
}
