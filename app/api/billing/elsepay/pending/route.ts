import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb } from "@/lib/db";

// GET -> {ok, pending:[{chargeId, plan, cycle, amount, status, createdAt}]}
// Own recent Else Pay checkouts (for return-verify when localStorage was
// lost, e.g. paid on another device/browser).
export async function GET() {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const db = await readDb();
  const mine = (db.elsepay || [])
    .filter((e) => e.userId === p.sub)
    .slice(-10)
    .reverse()
    .map((e) => ({
      chargeId: e.chargeId,
      plan: e.plan,
      cycle: (e as { cycle?: unknown }).cycle || "monthly",
      amount: e.amount,
      status: e.status,
      createdAt: e.createdAt,
    }));
  return NextResponse.json({ ok: true, pending: mine });
}
