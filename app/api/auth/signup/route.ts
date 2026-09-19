import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { readDb, writeDb, uid } from "@/lib/db";
import { signJwt } from "@/lib/auth";
import { rateLimit, clientIp, passwordError, cookieSecure, clampText, csrfCheck, csrfBlock } from "@/lib/security";
import { honeypot, isVpn } from "@/lib/antifraud";

export async function POST(req: Request) {
  if (!csrfCheck(req)) return csrfBlock();
  const ip = clientIp(req);
  const rl = rateLimit("signup:" + ip, 5, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many signups from this network. Try again later." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  if (honeypot(body)) return NextResponse.json({ error: "Bot detected." }, { status: 400 });
  if (await isVpn(ip)) {
    const db0 = await readDb();
    db0.events.push({ id: uid("e"), userId: "anon", action: "vpn_block", detail: "signup from VPN/proxy", at: new Date().toISOString() });
    await writeDb(db0);
    return NextResponse.json({ error: "VPN/Proxy connections are not allowed. Disable it and try again." }, { status: 403 });
  }
  const { email, password } = body;
  const mail = clampText(email, 120).trim().toLowerCase();
  if (!mail || !/^\S+@\S+\.\S+$/.test(mail)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const pwErr = passwordError(String(password || ""));
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });
  const db = await readDb();
  if (db.users.find((u) => u.email.toLowerCase() === mail)) return NextResponse.json({ error: "Account already exists. Please log in." }, { status: 409 });
  const passHash = await bcrypt.hash(String(password), 10);
  const u = { id: uid("u"), email: mail, passHash, role: "user" as const, plan: "free" as const, createdAt: new Date().toISOString() };
  db.users.push(u);
  db.mcpKeys.push({ userId: u.id, key: "cb_" + crypto.randomBytes(12).toString("hex") });
  db.usage.push({ userId: u.id, mcpCalls: 0, githubCalls: 0, balance: 10000, usedTotal: 0 });
  db.events.push({ id: uid("e"), userId: u.id, action: "signup", detail: u.email, at: new Date().toISOString() });
  await writeDb(db);
  const token = await signJwt({ sub: u.id, email: u.email, role: u.role });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, { httpOnly: true, path: "/", maxAge: 604800, sameSite: "lax", secure: cookieSecure(req) });
  return res;
}
