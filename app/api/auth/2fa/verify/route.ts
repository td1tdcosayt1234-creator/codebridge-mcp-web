import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import { decToken } from "@/lib/crypto";
import { totpVerify, backupMatches } from "@/lib/totp";

export const dynamic = "force-dynamic";

// Step 2 of login: exchange short-lived tmp token + TOTP/backup code
// for a real session cookie. tmp comes from body or g2fa cookie (Google flow).
export async function POST(req: Request) {
  const { rateLimit, clientIp, cookieSecure, cookieDomain, recordViolation, isBanned, banResponse } = await import("@/lib/security");
  const ip = clientIp(req);
  if (isBanned(ip)) return banResponse();
  const rl = rateLimit("2fa_verify:" + ip, 10, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many tries." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const cookies = req.headers.get("cookie") || "";
  const m = cookies.split(";").map((s) => s.trim()).find((s) => s.startsWith("g2fa="));
  const tmp = String((body as Record<string, unknown>).tmp || "") || (m ? decodeURIComponent(m.slice(5)) : "");
  const code = String((body as Record<string, unknown>).code || "");
  const remember = (body as Record<string, unknown>).remember !== false;
  if (!tmp || !code) return NextResponse.json({ error: "Code required." }, { status: 400 });
  const p = await verifyJwt(tmp);
  if (!p?.sub || (p as Record<string, unknown>).purpose !== "2fa") {
    recordViolation(ip, 2);
    return NextResponse.json({ error: "Session expired. Log in again." }, { status: 401 });
  }
  const db = await readDb();
  const u = db.users.find((x) => x.id === p.sub);
  if (!u) return NextResponse.json({ error: "Unknown account." }, { status: 401 });
  const secret = u.twoFaEnc ? decToken(u.twoFaEnc) : "";
  if (!secret) return NextResponse.json({ error: "2FA is not on." }, { status: 400 });
  let ok = totpVerify(secret, code);
  if (!ok) {
    const idx = (u.twoFaBackup || []).findIndex((h) => backupMatches(h, code));
    if (idx >= 0) {
      ok = true;
      u.twoFaBackup = (u.twoFaBackup || []).filter((_, i) => i !== idx);
      db.events.push({ id: uid("e"), userId: u.id, action: "2fa_backup_used", detail: (u.twoFaBackup || []).length + " left", at: new Date().toISOString() });
    }
  }
  if (!ok) {
    recordViolation(ip, 2);
    db.events.push({ id: uid("e"), userId: u.id, action: "2fa_fail", detail: u.email, at: new Date().toISOString() });
    await writeDb(db);
    return NextResponse.json({ error: "Wrong code." }, { status: 401 });
  }
  db.attempts = db.attempts.filter((a) => a.email !== u.email);
  db.events.push({ id: uid("e"), userId: u.id, action: "login_2fa", detail: u.email, at: new Date().toISOString() });
  await writeDb(db);
  const { signJwt } = await import("@/lib/auth");
  const wantRem = (p as Record<string, unknown>).remember !== false && remember;
  const token = await signJwt({ sub: u.id, email: u.email, role: u.role }, wantRem ? "30d" : "24h");
  const res = NextResponse.json({ ok: true, role: u.role });
  res.cookies.set("session", token, { httpOnly: true, path: "/", domain: cookieDomain(req), maxAge: wantRem ? 30 * 24 * 3600 : 24 * 3600, sameSite: "lax", secure: cookieSecure(req) });
  res.cookies.set("g2fa", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
