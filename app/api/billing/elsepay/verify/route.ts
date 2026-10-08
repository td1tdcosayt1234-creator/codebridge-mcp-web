import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import { PRICING, normalizeCycle } from "@/lib/billing";
import { getElseCharge, expectedElseAmount } from "@/lib/elsepay";

// POST {charge_id} -> {ok, plan} — user returns from Else Pay checkout and
// polls this. Credits coins when the gateway reports paid. Idempotent.
// (Webhook covers the async path; this covers localhost/dev where the
// public webhook URL can't reach us.)
export async function POST(req: Request) {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const chargeId = String((body as Record<string, unknown>)?.charge_id || "");
  if (!chargeId) return NextResponse.json({ error: "charge_id required" }, { status: 400 });
  const db = await readDb();
  if (!db.elsepay) db.elsepay = [];
  const pending = db.elsepay.find((e) => e.chargeId === chargeId);
  if (!pending || pending.userId !== p.sub)
    return NextResponse.json({ error: "Unknown charge" }, { status: 404 });
  if (pending.status === "paid" || db.webhookIds.includes("else_" + chargeId)) {
    const u0 = db.users.find((x) => x.id === p.sub);
    return NextResponse.json({ ok: true, plan: u0?.plan || pending.plan, duplicate: true });
  }
  let remote: { status: string; amount: number };
  try {
    remote = await getElseCharge(chargeId);
  } catch {
    return NextResponse.json({ error: "Gateway lookup failed" }, { status: 502 });
  }
  if (remote.status !== "paid")
    return NextResponse.json({ ok: true, paid: false, status: remote.status });
  const plan = pending.plan;
  const cycle = normalizeCycle((pending as { cycle?: unknown }).cycle);
  if (Number(remote.amount) !== expectedElseAmount(plan, cycle))
    return NextResponse.json({ ok: true, paid: false, ignored: "amount mismatch" });
  const u = db.users.find((x) => x.id === p.sub);
  if (!u) return NextResponse.json({ error: "Login required" }, { status: 401 });
  u.plan = plan;
  let usage = db.usage.find((x) => x.userId === u.id);
  if (!usage) {
    usage = { userId: u.id, mcpCalls: 0, githubCalls: 0, balance: 0, usedTotal: 0 };
    db.usage.push(usage);
  }
  usage.balance += PRICING[plan][cycle].coins;
  pending.status = "paid";
  const ex = db.billing.find((b) => b.userId === u.id && b.plan === plan);
  const rec = {
    userId: u.id,
    plan,
    cycle,
    customerId: "elsepay",
    subscriptionId: chargeId,
    status: "active",
    updatedAt: new Date().toISOString(),
  };
  if (ex) Object.assign(ex, rec);
  else db.billing.push(rec);
  db.webhookIds.push("else_" + chargeId);
  if (db.webhookIds.length > 500) db.webhookIds = db.webhookIds.slice(-500);
  db.events.push({
    id: uid("e"),
    userId: u.id,
    action: "elsepay_paid",
    detail: plan + " " + cycle + " " + chargeId,
    at: new Date().toISOString(),
  });
  await writeDb(db);
  return NextResponse.json({ ok: true, paid: true, plan, cycle });
}
