import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import { PRICING, normalizeCycle, type PlanId } from "@/lib/billing";
import { createElseCharge, elsepayConfigured } from "@/lib/elsepay";

// Public origin of THIS app (used for Else Pay returnUrl). Never 0.0.0.0 —
// browsers can't open that. Prefers explicit NEXT_PUBLIC_SITE_URL, else the
// request Host (tunnel hostname or localhost).
function publicOrigin(req: Request): string {
  const pinned = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  if (pinned) return pinned;
  const fwd = (req.headers.get("x-forwarded-host") || "").split(",")[0].trim();
  const raw = (fwd || req.headers.get("host") || "localhost:3001").trim();
  const host = raw.replace(/^0\.0\.0\.0(?=[:/]|$)/, "localhost") || "localhost:3001";
  const proto = (req.headers.get("x-forwarded-proto") || "").split(",")[0].trim()
    || (/localhost|127\.0\.0\.1/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

// POST {plan:"pro"|"team", cycle?} -> {ok, url, charge_id} (Else Pay checkout).
// Login must. User pays with Else earned $ at the Else gateway, then
// returns here — verify via /api/billing/elsepay/verify or webhook.
export async function POST(req: Request) {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { csrfCheck, csrfBlock, rateLimit, clientIp } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const rl = rateLimit("elsepay-checkout:" + p.sub + ":" + clientIp(req), 10, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  if (!elsepayConfigured())
    return NextResponse.json({ error: "Else Pay not configured" }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const { plan = "" } = body as Record<string, unknown>;
  // Tier-2: money leaves here — 2FA-enrolled users must send a fresh code.
  const { stepupInput, requireStepUp } = await import("@/lib/stepup");
  const step = await requireStepUp(String(p.sub), stepupInput(req, body));
  if (!step.ok)
    return NextResponse.json({ error: "Fresh 2FA code required (x-2fa-code)." }, { status: 403 });
  if (plan !== "pro" && plan !== "team") return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  const cycle = normalizeCycle((body as Record<string, unknown>).cycle);
  const db = await readDb();
  const u = db.users.find((x) => x.id === p.sub);
  if (!u) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (u.plan === plan) return NextResponse.json({ error: "Already on this plan" }, { status: 400 });
  try {
    const origin = publicOrigin(req);
    const charge = await createElseCharge({
      userId: u.id,
      plan: plan as PlanId,
      cycle,
      returnUrl: origin + "/pricing?elsepay=" + plan,
    });
    if (!db.elsepay) db.elsepay = [];
    db.elsepay.push({
      chargeId: charge.charge_id,
      userId: u.id,
      plan: plan as PlanId,
      cycle,
      amount: charge.amount,
      status: "created",
      createdAt: new Date().toISOString(),
    });
    db.events.push({
      id: uid("e"),
      userId: u.id,
      action: "elsepay_checkout",
      detail: plan + " " + cycle + " " + charge.charge_id,
      at: new Date().toISOString(),
    });
    await writeDb(db);
    return NextResponse.json({
      ok: true,
      url: charge.checkout_url,
      charge_id: charge.charge_id,
      plan,
      cycle,
      coins: PRICING[plan as PlanId][cycle].coins,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e).slice(0, 200) }, { status: 502 });
  }
}
