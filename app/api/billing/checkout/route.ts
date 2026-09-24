import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import { PLANS, createCheckout, paddleConfigured, type PlanId } from "@/lib/billing";

// POST {plan:"pro"|"team"} -> {ok, url} (Paddle hosted checkout). Login must.
export async function POST(req: Request) {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { csrfCheck, csrfBlock } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  if (!paddleConfigured()) return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
  const { plan = "" } = await req.json().catch(() => ({}));
  if (plan !== "pro" && plan !== "team") return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  const db = await readDb();
  const u = db.users.find((x) => x.id === p.sub);
  if (!u) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (u.plan === plan) return NextResponse.json({ error: "Already on this plan" }, { status: 400 });
  try {
    const { url } = await createCheckout({ email: u.email, userId: u.id, plan: plan as PlanId });
    db.events.push({ id: uid("e"), userId: u.id, action: "billing_checkout", detail: plan, at: new Date().toISOString() });
    await writeDb(db);
    return NextResponse.json({ ok: true, url, plan, coins: PLANS[plan as PlanId].coins });
  } catch (e) {
    const m = String(e).slice(0, 200);
    const friendly = /onboarding/i.test(m)
      ? "Paddle onboarding incomplete — finish verification in your Paddle dashboard, then retry."
      : m;
    return NextResponse.json({ error: friendly }, { status: 502 });
  }
}
