import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import { PLANS } from "@/lib/billing";

// Admin-only manual plan grant (fallback while Paddle onboarding pends,
// or for manual payments). POST {userId, plan:"free"|"pro"|"team"}.
export async function POST(req: Request) {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p || p.role !== "admin") return NextResponse.json({ error: "admin only" }, { status: 403 });
  const { userId = "", plan = "" } = await req.json().catch(() => ({}));
  if (!userId || (plan !== "free" && plan !== "pro" && plan !== "team")) {
    return NextResponse.json({ error: "userId + plan (free/pro/team) required" }, { status: 400 });
  }
  const db = await readDb();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return NextResponse.json({ error: "Unknown user" }, { status: 404 });
  if (u.plan === plan) return NextResponse.json({ ok: true, plan, unchanged: true });
  u.plan = plan;
  if (plan === "pro" || plan === "team") {
    let usage = db.usage.find((x) => x.userId === userId);
    if (!usage) { usage = { userId, mcpCalls: 0, githubCalls: 0, balance: 0, usedTotal: 0 }; db.usage.push(usage); }
    usage.balance += PLANS[plan as "pro" | "team"].coins;
  }
  db.events.push({ id: uid("e"), userId, action: "admin_grant", detail: plan + " by " + p.sub, at: new Date().toISOString() });
  await writeDb(db);
  return NextResponse.json({ ok: true, plan });
}
