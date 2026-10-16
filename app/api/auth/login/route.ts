import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readDb, writeDb, uid, syncAdminFromEnv } from "@/lib/db";
import { signJwt } from "@/lib/auth";
import { cookieSecure, cookieDomain, csrfCheck, csrfBlock } from "@/lib/security";

export async function POST(req: Request) {
  if (!csrfCheck(req)) return csrfBlock();
  const { email, password, remember } = await req.json().catch(() => ({}));
  const { fpOf } = await import("@/lib/tracker");
  // NOTE: all blockers (ban/bot/timing/rate/lockout) disabled by owner.
  const mail = String(email || "").trim().toLowerCase().slice(0, 120);
  if (!mail || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  // Bcrypt DoS guard: unbounded passwords burn CPU per attempt.
  if (String(password).length > 128) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  await syncAdminFromEnv(); // env-changed admin credentials take effect
  const db = await readDb();
  const u = db.users.find((x) => x.email.toLowerCase() === mail);
  // Always run the hash compare (constant-time UX): valid and invalid emails
  // take the same time, so the response timing reveals nothing.
  const ok = await bcrypt.compare(String(password), u?.passHash || "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinval");
  if (!u || !ok) {
    const { fpOf } = await import("@/lib/tracker");
    db.events.push({ id: uid("e"), userId: u?.id || "anon", action: "login_fail", detail: mail, fp: fpOf(req), at: new Date().toISOString() });
    await writeDb(db);
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  db.attempts = db.attempts.filter((a) => a.email !== mail);
  // Email gate: unverified accounts must finish the OTP first.
  // (Missing flag on old rows means verified — grandfathered.)
  if (u.emailVerified === false)
    return NextResponse.json({ error: "Email not verified. Enter the code we sent.", verifyRequired: true }, { status: 403 });
  // Tier-2: 2FA enrolled -> short-lived tmp token, code verified at /2fa/verify.
  const { decToken } = await import("@/lib/crypto");
  if (u.twoFaEnc && decToken(u.twoFaEnc)) {
    db.events.push({ id: uid("e"), userId: u.id, action: "login_step1", detail: u.email, at: new Date().toISOString() });
    await writeDb(db);
    const tmp = await signJwt({ sub: u.id, purpose: "2fa", remember: !!remember }, "5m");
    return NextResponse.json({ ok: true, need2fa: true, tmp });
  }
  db.events.push({ id: uid("e"), userId: u.id, action: "login", detail: u.email, fp: fpOf(req), at: new Date().toISOString() });
  await writeDb(db);
  const token = await signJwt({ sub: u.id, email: u.email, role: u.role }, remember ? "30d" : "24h");
  const res = NextResponse.json({ ok: true, role: u.role });
  // Cookie lifetime matches the JWT lifetime — a stale cookie can never outlive its token.
  res.cookies.set("session", token, { httpOnly: true, path: "/", domain: cookieDomain(req), maxAge: remember ? 30 * 24 * 3600 : 24 * 3600, sameSite: "lax", secure: cookieSecure(req) });
  return res;
}
