import { NextResponse } from "next/server";
import { readDb, writeDb, uid } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { rateLimit, clientIp, clampText } from "@/lib/security";
import { honeypot } from "@/lib/antifraud";

export async function POST(req: Request) {
  const rl = rateLimit("support:" + clientIp(req), 5, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many tickets. Please wait before sending another." }, { status: 429 });
  const raw = await req.json().catch(() => ({}));
  if (honeypot(raw)) return NextResponse.json({ error: "Bot detected." }, { status: 400 });
  const { subject, body } = raw;
  const s = clampText(subject, 120).trim();
  const b = clampText(body, 2000).trim();
  if (!s || !b) return NextResponse.json({ error: "Subject and message are both required." }, { status: 400 });
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  const db = await readDb();
  db.tickets.push({ id: uid("t"), userId: p?.sub || "anon", subject: s, body: b, status: "open", at: new Date().toISOString() });
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
