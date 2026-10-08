import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PLANS, PRICING, paddleConfigured, paddleCycleConfigured } from "@/lib/billing";
import { elsepayConfigured, elsepayPublicBase } from "@/lib/elsepay";

// Public billing config + viewer's plan (for /pricing buttons).
export async function GET() {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  let plan = "free";
  if (p) {
    const db = await readDb();
    plan = db.users.find((x) => x.id === p.sub)?.plan || "free";
  }
  const cycles = {
    pro: {
      weekly: { ...PRICING.pro.weekly, paddle: paddleCycleConfigured("pro", "weekly") },
      monthly: { ...PRICING.pro.monthly, paddle: paddleCycleConfigured("pro", "monthly") },
      annual: { ...PRICING.pro.annual, paddle: paddleCycleConfigured("pro", "annual") },
    },
    team: {
      weekly: { ...PRICING.team.weekly, paddle: paddleCycleConfigured("team", "weekly") },
      monthly: { ...PRICING.team.monthly, paddle: paddleCycleConfigured("team", "monthly") },
      annual: { ...PRICING.team.annual, paddle: paddleCycleConfigured("team", "annual") },
    },
  };
  return NextResponse.json({
    ok: true,
    configured: paddleConfigured(),
    elsepay: { configured: elsepayConfigured(), publicUrl: elsepayPublicBase() },
    plan,
    plans: [
      { id: "free", name: "Free", price: "$0", coins: 10000 },
      { id: "pro", name: "Pro", price: "$12/mo", coins: PLANS.pro.coins },
      { id: "team", name: "Team", price: "$39/mo", coins: PLANS.team.coins },
    ],
    cycles,
  });
}
