import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { spamReport } from "@/lib/tracker";

// Admin-only spam radar: risk-scored users + device/network clusters.
// Detection only — enforcement stays with rate limits, VPN/bot gates and
// the suspend ladder (no auto-punish, so legit users are never hurt).
export async function GET() {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p || p.role !== "admin") return NextResponse.json({ error: "admin only" }, { status: 403 });
  const db = await readDb();
  const rep = spamReport({ users: db.users, events: db.events });
  const mailOf = (id: string) => db.users.find((u) => u.id === id)?.email || id;
  return NextResponse.json({
    ...rep,
    rows: rep.rows.map((r) => ({ ...r })),
    clusters: rep.clusters.map((c) => ({ ...c, emails: c.userIds.map(mailOf) })),
    counts: { users: db.users.length, events: db.events.length },
  });
}
