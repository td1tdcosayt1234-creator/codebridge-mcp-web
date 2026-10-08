import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import { PRICING, createCheckout, normalizeCycle, paddleCycleConfigured, type PlanId } from "@/lib/billing";

// POST {plan:"pro"|"team", cycle?} -> {ok, url} (Paddle hosted checkout). Login must.
export async function POST(req: Request) {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { csrfCheck, csrfBlock, rateLimit, clientIp } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const rl = rateLimit("checkout:" + p.sub + ":" + clientIp(req), 10, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const { plan = "" } = body as Record<string, unknown>;
  // Tier-2: money leaves here — 2FA-enrolled users must send a fresh code.
  const { stepupInput, requireStepUp } = await import("@/lib/stepup");
  const step = await requireStepUp(String(p.sub), stepupInput(req, body));
  if (!step.ok)
    return NextResponse.json({ error: "Fresh 2FA code required (x-2fa-code)." }, { status: 403 });
  if (plan !== "pro" && plan !== "team") return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  const cycle = normalizeCycle((body as Record<string, unknown>).cycle);
  if (!paddleCycleConfigured(plan as PlanId, cycle))
    return NextResponse.json({ error: cycle === "monthly" ? "Payments not configured" : `Paddle ${cycle} price not configured` }, { status: 503 });
  const db = await readDb();
  const u = db.users.find((x) => x.id === p.sub);
  if (!u) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (u.plan === plan) return NextResponse.json({ error: "Already on this plan" }, { status: 400 });
  try {
    const { url } = await createCheckout({ email: u.email, userId: u.id, plan: plan as PlanId, cycle });
    db.events.push({ id: uid("e"), userId: u.id, action: "billing_checkout", detail: plan + " " + cycle, at: new Date().toISOString() });
    await writeDb(db);
    return NextResponse.json({ ok: true, url, plan, cycle, coins: PRICING[plan as PlanId][cycle].coins });
  } catch (e) {
    const m = String(e).slice(0, 200);
    const friendly = /onboarding/i.test(m)
      ? "Paddle onboarding incomplete — finish verification in your Paddle dashboard, then retry."
      : m;
    return NextResponse.json({ error: friendly }, { status: 502 });
  }
}
