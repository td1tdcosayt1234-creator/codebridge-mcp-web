import { NextResponse } from "next/server";
import { readDb, writeDb, uid } from "@/lib/db";
import { PLANS, verifyWebhookSignature } from "@/lib/billing";

// Paddle Billing webhook. Destination: https://<public-host>/api/billing/webhook
// Enable event: transaction.completed. Secret: PADDLE_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET || "";
  if (!secret) {
    console.warn("[billing] webhook hit but PADDLE_WEBHOOK_SECRET not set — ignoring");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  const raw = await req.text();
  const sig = req.headers.get("paddle-signature");
  if (!verifyWebhookSignature(raw, sig, secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }
  let ev: any = null;
  try { ev = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  if (ev?.event_type !== "transaction.completed") return NextResponse.json({ ok: true, ignored: ev?.event_type || "?" });

  const d = ev?.data || {};
  const cd = d?.custom_data || {};
  const userId = String(cd.userId || "");
  const plan = String(cd.plan || "");
  if (!userId || (plan !== "pro" && plan !== "team")) return NextResponse.json({ ok: true, ignored: "no custom_data" });

  const db = await readDb();
  // Idempotency: Paddle retries until 2xx — never credit twice for one event.
  // event_id is REQUIRED: without it we cannot dedup, so we refuse to credit.
  const eventId = String(ev?.event_id || "");
  if (!eventId) return NextResponse.json({ ok: true, ignored: "no event_id" });
  if (db.webhookIds.includes(eventId)) return NextResponse.json({ ok: true, duplicate: true });
  const u = db.users.find((x) => x.id === userId);
  if (!u) return NextResponse.json({ ok: true, ignored: "unknown user" });
  // Verify the paid price matches the credited plan — a discounted/swapped
  // checkout must not mint higher-tier coins.
  const paidPriceIds = (Array.isArray(d?.items) ? d.items : [])
    .map((it: any) => String(it?.price?.id || it?.price_id || ""))
    .filter(Boolean);
  const wantPrice = plan === "pro" ? process.env.PADDLE_PRO_PRICE_ID || "" : process.env.PADDLE_TEAM_PRICE_ID || "";
  if (paidPriceIds.length > 0 && wantPrice && !paidPriceIds.includes(wantPrice))
    return NextResponse.json({ ok: true, ignored: "price mismatch" });
  u.plan = plan as "pro" | "team";
  let usage = db.usage.find((x) => x.userId === userId);
  if (!usage) { usage = { userId, mcpCalls: 0, githubCalls: 0, balance: 0, usedTotal: 0 }; db.usage.push(usage); }
  usage.balance += PLANS[plan as "pro" | "team"].coins;
  const subId = String(d?.subscription_id || "");
  const custId = String(d?.customer_id || "");
  const ex = db.billing.find((b) => b.userId === userId && b.plan === plan);
  const rec = { userId, plan: plan as "pro" | "team", customerId: custId, subscriptionId: subId, status: String(d?.status || "active"), updatedAt: new Date().toISOString() };
  if (ex) Object.assign(ex, rec); else db.billing.push(rec);
  db.webhookIds.push(eventId); if (db.webhookIds.length > 500) db.webhookIds = db.webhookIds.slice(-500);
  db.events.push({ id: uid("e"), userId, action: "billing_paid", detail: plan + " " + (d?.id || ""), at: new Date().toISOString() });
  await writeDb(db);
  return NextResponse.json({ ok: true, plan });
}
