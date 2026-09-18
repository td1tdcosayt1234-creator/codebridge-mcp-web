import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/security";
import { isVpn } from "@/lib/antifraud";
import { EARN_REWARD, EARN_SECONDS, EARN_DAILY_MAX } from "@/lib/earn";
import crypto from "crypto";

async function me() {
  const t = cookies().get("session")?.value || "";
  return await verifyJwt(t);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function earnedToday(db: Awaited<ReturnType<typeof readDb>>, userId: string): number {
  const day = todayKey();
  return db.events.filter((e) => e.userId === userId && e.action === "ad_earn" && e.at.slice(0, 10) === day).length;
}

export async function GET() {
  const p = await me();
  if (!p) return NextResponse.json({ error: "auth" }, { status: 401 });
  const db = await readDb();
  const us = db.usage.find((u) => u.userId === p.sub);
  const done = earnedToday(db, p.sub);
  return NextResponse.json({
    reward: EARN_REWARD, seconds: EARN_SECONDS, dailyMax: EARN_DAILY_MAX,
    remainingToday: Math.max(0, EARN_DAILY_MAX - done), balance: us?.balance ?? 0,
  });
}

export async function POST(req: Request) {
  const p = await me();
  if (!p) return NextResponse.json({ error: "auth" }, { status: 401 });
  const rl = rateLimit("earn:" + p.sub, 30, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many tries. Wait a bit." }, { status: 429 });
  const { action, nonce } = await req.json().catch(() => ({}));
  const db = await readDb();
  if (action === "start") {
    if (earnedToday(db, p.sub) >= EARN_DAILY_MAX)
      return NextResponse.json({ error: "Daily ad limit reached. Come back tomorrow." }, { status: 400 });
    const n = "ad_" + crypto.randomBytes(16).toString("hex");
    db.earnNonces.push({ nonce: n, userId: p.sub, at: Date.now(), used: false });
    await writeDb(db);
    return NextResponse.json({ ok: true, nonce: n, seconds: EARN_SECONDS, reward: EARN_REWARD });
  }
  if (action === "complete") {
    if (await isVpn(clientIp(req))) {
      db.events.push({ id: uid("e"), userId: p.sub, action: "vpn_block", detail: "earn from VPN/proxy", at: new Date().toISOString() });
      await writeDb(db);
      return NextResponse.json({ error: "VPN/Proxy detected. Disable it to earn coins." }, { status: 403 });
    }
    const rec = db.earnNonces.find((n) => n.nonce === String(nonce || ""));
    if (!rec || rec.userId !== p.sub || rec.used)
      return NextResponse.json({ error: "Invalid or expired ad session. Watch again." }, { status: 400 });
    const watched = (Date.now() - rec.at) / 1000;
    if (watched < EARN_SECONDS)
      return NextResponse.json({ error: "Ad skipped too early. Watch the full ad." }, { status: 400 });
    if (earnedToday(db, p.sub) >= EARN_DAILY_MAX)
      return NextResponse.json({ error: "Daily ad limit reached." }, { status: 400 });
    rec.used = true;
    let us = db.usage.find((u) => u.userId === p.sub);
    if (!us) { us = { userId: p.sub, mcpCalls: 0, githubCalls: 0, balance: 10000, usedTotal: 0 }; db.usage.push(us); }
    us.balance += EARN_REWARD;
    db.events.push({ id: uid("e"), userId: p.sub, action: "ad_earn", detail: "+" + EARN_REWARD + " tokens for ad view", at: new Date().toISOString() });
    await writeDb(db);
    return NextResponse.json({ ok: true, reward: EARN_REWARD, balance: us.balance });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
