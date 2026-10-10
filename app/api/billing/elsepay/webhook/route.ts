import { NextResponse } from "next/server";
import { readDb, writeDb, uid } from "@/lib/db";
import { PRICING, normalizeCycle } from "@/lib/billing";
import { getElseCharge, expectedElseAmount, verifyElseWebhook } from "@/lib/elsepay";

// Else Pay merchant webhook. Destination (set in Else console merchants):
// https://roun.sryze.cc/api/billing/elsepay/webhook
// Header: x-else-signature = merchant secretKey. Body: {charge_id, status, ...}
export async function POST(req: Request) {
  if (!verifyElseWebhook(req))
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  const { clientIp, rateLimit } = await import("@/lib/security");
  const rl = rateLimit("elsepay-webhook:" + clientIp(req), 60, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const chargeId = String((body as Record<string, unknown>)?.charge_id || "");
  if (!chargeId) return NextResponse.json({ ok: true, ignored: "no charge_id" });
  // Confirm paid state server-side — never trust the POST body alone.
  let remote: { status: string; amount: number };
  try {
    remote = await getElseCharge(chargeId);
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 502 });
  }
  if (remote.status !== "paid") return NextResponse.json({ ok: true, ignored: remote.status });

  const db = await readDb();
  // Idempotency: gateway may retry — never credit twice for one charge.
  const eventId = "else_" + chargeId;
  if (db.webhookIds.includes(eventId)) return NextResponse.json({ ok: true, duplicate: true });
  if (!db.elsepay) db.elsepay = [];
  const pending = db.elsepay.find((e) => e.chargeId === chargeId);
  if (!pending) return NextResponse.json({ ok: true, ignored: "unknown charge" });
  const plan = pending.plan;
  const cycle = normalizeCycle((pending as { cycle?: unknown }).cycle);
  // Paid amount must match the checkout's plan+cycle — a swapped/tampered
  // charge must not mint coins.
  if (Number(remote.amount) !== expectedElseAmount(plan, cycle))
    return NextResponse.json({ ok: true, ignored: "amount mismatch" });
  const userId = pending.userId || "";
  const u = db.users.find((x) => x.id === userId);
  if (!u) return NextResponse.json({ ok: true, ignored: "unknown user" });
  u.plan = plan;
  let usage = db.usage.find((x) => x.userId === userId);
  if (!usage) {
    usage = { userId, mcpCalls: 0, githubCalls: 0, balance: 0, usedTotal: 0 };
    db.usage.push(usage);
  }
  usage.balance += PRICING[plan][cycle].coins;
  if (pending) pending.status = "paid";
  const ex = db.billing.find((b) => b.userId === userId && b.plan === plan);
  const rec = {
    userId,
    plan,
    cycle,
    customerId: "elsepay",
    subscriptionId: chargeId,
    status: "active",
    updatedAt: new Date().toISOString(),
  };
  if (ex) Object.assign(ex, rec);
  else db.billing.push(rec);
  db.webhookIds.push(eventId);
  if (db.webhookIds.length > 500) db.webhookIds = db.webhookIds.slice(-500);
  db.events.push({
    id: uid("e"),
    userId,
    action: "elsepay_paid",
    detail: plan + " " + cycle + " " + chargeId,
    at: new Date().toISOString(),
  });
  await writeDb(db);
  return NextResponse.json({ ok: true, plan, cycle });
}
