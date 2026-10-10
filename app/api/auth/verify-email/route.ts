import { NextResponse } from "next/server";
import { readDb, writeDb, uid } from "@/lib/db";
import { signJwt } from "@/lib/auth";
import { rateLimit, clientIp, cookieSecure, cookieDomain, csrfCheck, csrfBlock } from "@/lib/security";
import { checkSignupOtp, sendSignupOtp } from "@/lib/elsemail";
import { newPersonalKey } from "@/lib/mcpOAuth";

// POST {email, code} -> verify OTP, mark verified, grant coins+key, session.
// POST {action:"resend", email} -> fresh OTP for unverified accounts.
export async function POST(req: Request) {
  if (!csrfCheck(req)) return csrfBlock();
  const ip = clientIp(req);
  const rl = rateLimit("verify_email:" + ip, 20, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many tries. Try again later." }, { status: 429 });
  const { action, email, code, remember } = await req.json().catch(() => ({}));
  const mail = String(email || "").trim().toLowerCase().slice(0, 120);
  if (!mail || !/^\S+@\S+\.\S+$/.test(mail)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  if (action === "resend") {
    const db = await readDb();
    const u = db.users.find((x) => x.email.toLowerCase() === mail);
    // Anti-enumeration: same shape whether or not the address exists.
    if (!u || u.emailVerified !== false) return NextResponse.json({ ok: true, resent: true });
    const mailRes = await sendSignupOtp(mail);
    if (!mailRes.ok) return NextResponse.json({ error: mailRes.error || "Could not send code." }, { status: 502 });
    db.events.push({ id: uid("e"), userId: u.id, action: "otp_resend", detail: u.email, at: new Date().toISOString() });
    await writeDb(db);
    return NextResponse.json({ ok: true, resent: true });
  }

  const otp = String(code || "").replace(/\D/g, "").slice(0, 6);
  if (otp.length !== 6) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
  const chk = await checkSignupOtp(mail, otp);
  if (!chk.ok) {
    const why = chk.error || "Wrong or expired code.";
    const hint = /not found|expired/i.test(why)
      ? " Code expired or a newer one was sent — press Resend and use the LATEST mail."
      : /attempts/i.test(why)
        ? " Too many wrong tries — press Resend for a fresh code."
        : " Use the code from the LATEST mail only.";
    return NextResponse.json({ error: why + hint }, { status: 400 });
  }

  const db = await readDb();
  const u = db.users.find((x) => x.email.toLowerCase() === mail);
  if (!u) return NextResponse.json({ error: "Account not found. Sign up first." }, { status: 404 });
  if (u.emailVerified !== false) {
    // Already verified (OTP valid but account active) — just log in.
    const token0 = await signJwt({ sub: u.id, email: u.email, role: u.role }, "24h");
    const res0 = NextResponse.json({ ok: true, role: u.role });
    res0.cookies.set("session", token0, { httpOnly: true, path: "/", domain: cookieDomain(req), maxAge: 24 * 3600, sameSite: "lax", secure: cookieSecure(req) });
    return res0;
  }
  u.emailVerified = true;
  // Coins + key are granted HERE so fake mailboxes can never farm 10k.
  db.mcpKeys.push({ userId: u.id, key: newPersonalKey() });
  db.usage.push({ userId: u.id, mcpCalls: 0, githubCalls: 0, balance: 10000, usedTotal: 0 });
  db.events.push({ id: uid("e"), userId: u.id, action: "email_verified", detail: u.email, at: new Date().toISOString() });
  await writeDb(db);
  const token = await signJwt({ sub: u.id, email: u.email, role: u.role }, remember ? "30d" : "24h");
  const res = NextResponse.json({ ok: true, role: u.role });
  res.cookies.set("session", token, { httpOnly: true, path: "/", domain: cookieDomain(req), maxAge: remember ? 30 * 24 * 3600 : 24 * 3600, sameSite: "lax", secure: cookieSecure(req) });
  return res;
}
