import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readDb, writeDb, uid } from "@/lib/db";
import { rateLimit, clientIp, passwordError, clampText, csrfCheck, csrfBlock, recordViolation, isBanned, banResponse } from "@/lib/security";
import { honeypot, isVpn, isBotUA, humanTimingOk } from "@/lib/antifraud";
import { fpOf } from "@/lib/tracker";
import { sendSignupOtp } from "@/lib/elsemail";
import { cleanName, nameError, countryError } from "@/lib/profile";

export async function POST(req: Request) {
  if (!csrfCheck(req)) return csrfBlock();
  const ip = clientIp(req);
  if (isBanned(ip)) return banResponse(ip);
  const rl = rateLimit("signup:" + ip, 5, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many signups from this network. Try again later." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  if (honeypot(body)) { recordViolation(ip, 5); return NextResponse.json({ error: "Bot detected." }, { status: 400 }); }
  // Headless/script UA + instant-submit trap (bots fill forms in ms).
  if (isBotUA(req.headers.get("user-agent"))) { recordViolation(ip, 5); return NextResponse.json({ error: "Bot detected." }, { status: 400 }); }
  if (!humanTimingOk((body as Record<string, unknown>).ts, 2000)) { recordViolation(ip, 4); return NextResponse.json({ error: "Too fast. Please fill the form normally." }, { status: 400 }); }
  if (await isVpn(ip)) {
    recordViolation(ip, 1); // soft signal only — VPN flags have false positives
    const db0 = await readDb();
    db0.events.push({ id: uid("e"), userId: "anon", action: "vpn_block", detail: "signup from VPN/proxy", fp: fpOf(req), at: new Date().toISOString() });
    await writeDb(db0);
    return NextResponse.json({ error: "VPN/Proxy connections are not allowed. Disable it and try again. No VPN on? Wait ~10 min and retry (network check refreshes)." }, { status: 403 });
  }
  const { email, password, firstName, lastName, country } = body;
  const mail = clampText(email, 120).trim().toLowerCase();
  if (!mail || !/^\S+@\S+\.\S+$/.test(mail)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const first = cleanName(firstName);
  const last = cleanName(lastName);
  const ctry = String(country || "").trim().slice(0, 60);
  const fErr = nameError(first, "First name");
  if (fErr) return NextResponse.json({ error: fErr }, { status: 400 });
  const lErr = nameError(last, "Last name");
  if (lErr) return NextResponse.json({ error: lErr }, { status: 400 });
  const cErr = countryError(ctry);
  if (cErr) return NextResponse.json({ error: cErr }, { status: 400 });
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
    // Never mutate an existing row from an unauthenticated dupe signup.
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
  const u = { id: uid("u"), email: mail, passHash, role: "user" as const, plan: "free" as const, createdAt: new Date().toISOString(), emailVerified: false as const, firstName: first, lastName: last, country: ctry };
  db.users.push(u);
  db.events.push({ id: uid("e"), userId: u.id, action: "signup", detail: u.email, fp: fpOf(req), at: new Date().toISOString() });
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
