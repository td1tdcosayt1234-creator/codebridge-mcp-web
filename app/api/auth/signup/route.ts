import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readDb, writeDb, uid } from "@/lib/db";
import { rateLimit, clientIp, passwordError, clampText, csrfCheck, csrfBlock } from "@/lib/security";
import { honeypot, isVpn } from "@/lib/antifraud";
import { sendSignupOtp } from "@/lib/elsemail";

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
  if (String(password).length > 128) return NextResponse.json({ error: "Password too long (max 128 characters)." }, { status: 400 });
  const db = await readDb();
  // Anti-enumeration: existing and new emails return a verify-shaped 200.
  // Existing UNVERIFIED accounts get a fresh OTP (account recovery path);
  // existing VERIFIED accounts get {existing:true} with NO session.
  const dupe = db.users.find((u) => u.email.toLowerCase() === mail);
  if (dupe) {
    await bcrypt.hash(String(password), 12).catch(() => "");
    if (dupe.emailVerified === false) {
      const mailRes = await sendSignupOtp(mail);
      if (!mailRes.ok) return NextResponse.json({ error: mailRes.error || "Could not send code." }, { status: 502 });
      db.events.push({ id: uid("e"), userId: dupe.id, action: "otp_resend", detail: dupe.email, at: new Date().toISOString() });
      await writeDb(db);
      return NextResponse.json({ ok: true, verifyRequired: true });
    }
    return NextResponse.json({ ok: true, existing: true });
  }
  const passHash = await bcrypt.hash(String(password), 12);
  // Unverified: NO session, NO coins, NO keys until the OTP is confirmed.
  // (Missing emailVerified on old rows means verified — grandfathered.)
  const u = { id: uid("u"), email: mail, passHash, role: "user" as const, plan: "free" as const, createdAt: new Date().toISOString(), emailVerified: false as const };
  db.users.push(u);
  db.events.push({ id: uid("e"), userId: u.id, action: "signup", detail: u.email, at: new Date().toISOString() });
  await writeDb(db);
  const mailRes = await sendSignupOtp(mail);
  if (!mailRes.ok) {
    // elsemail saves the OTP BEFORE sending, so a slow/timeout mail can
    // still arrive and verify — keep the account, let Resend heal it.
    // (No session/coins/keys exist yet, so dead rows are harmless.)
    const slow = /unreachable|slow|timeout|525|502/i.test(mailRes.error || "");
    db.events.push({ id: uid("e"), userId: u.id, action: "signup_otp_fail", detail: mailRes.error || "mail failed", at: new Date().toISOString() });
    await writeDb(db);
    if (slow) return NextResponse.json({ ok: true, verifyRequired: true, mailSlow: true });
    return NextResponse.json({ error: mailRes.error || "Could not send verification code." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, verifyRequired: true });
}
