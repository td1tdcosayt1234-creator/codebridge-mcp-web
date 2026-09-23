import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { PLANS, paddleConfigured } from "@/lib/billing";

// Public billing config + viewer's plan (for /pricing buttons).
export async function GET() {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  let plan = "free";
  if (p) {
    const db = await readDb();
    plan = db.users.find((x) => x.id === p.sub)?.plan || "free";
  }
  return NextResponse.json({
    ok: true,
    configured: paddleConfigured(),
    plan,
    plans: [
      { id: "free", name: "Free", price: "$0", coins: 10000 },
      { id: "pro", name: "Pro", price: "$12/mo", coins: PLANS.pro.coins },
      { id: "team", name: "Team", price: "$39/mo", coins: PLANS.team.coins },
    ],
  });
}
