import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readDb, writeDb, uid } from "@/lib/db";
import { signJwt } from "@/lib/auth";
import { rateLimit, clientIp, cookieSecure, csrfCheck, csrfBlock } from "@/lib/security";

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  if (!csrfCheck(req)) return csrfBlock();
  const ip = clientIp(req);
  const { email, password } = await req.json().catch(() => ({}));
  const mail = String(email || "").trim().toLowerCase().slice(0, 120);
  const rl = rateLimit("login:" + ip + ":" + mail, 10, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Try again in " + rl.retryAfterSec + "s." }, { status: 429 });
  if (!mail || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  const db = await readDb();
  const att = db.attempts.find((a) => a.email === mail);
  if (att && att.until && new Date(att.until).getTime() > Date.now())
    return NextResponse.json({ error: "Account locked after failed logins. Try again later." }, { status: 423 });
  const u = db.users.find((x) => x.email.toLowerCase() === mail);
  const ok = u ? await bcrypt.compare(String(password), u.passHash) : false;
  if (!u || !ok) {
    if (!att) db.attempts.push({ email: mail, fails: 1, until: "" });
    else {
      att.fails += 1;
      if (att.fails >= MAX_FAILS && !att.until) {
        att.until = new Date(Date.now() + LOCK_MS).toISOString();
        db.events.push({ id: uid("e"), userId: u?.id || "anon", action: "lockout", detail: mail + " locked 15m", at: new Date().toISOString() });
      }
    }
    if (u) db.events.push({ id: uid("e"), userId: u.id, action: "login_fail", detail: u.email, at: new Date().toISOString() });
    await writeDb(db);
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  db.attempts = db.attempts.filter((a) => a.email !== mail);
  db.events.push({ id: uid("e"), userId: u.id, action: "login", detail: u.email, at: new Date().toISOString() });
  await writeDb(db);
  const token = await signJwt({ sub: u.id, email: u.email, role: u.role });
  const res = NextResponse.json({ ok: true, role: u.role });
  res.cookies.set("session", token, { httpOnly: true, path: "/", maxAge: 604800, sameSite: "lax", secure: cookieSecure(req) });
  return res;
}
