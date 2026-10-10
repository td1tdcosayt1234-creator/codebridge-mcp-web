import { NextResponse } from "next/server";
import crypto from "crypto";
import { readDb, writeDb, uid } from "@/lib/db";
import { rateLimit, clientIp, clampText, csrfCheck, csrfBlock } from "@/lib/security";
import { sendBrandedMail } from "@/lib/elsemail";

function siteBase(req: Request): string {
  const env = (process.env.SITE_URL || "").replace(/\/+$/, "");
  if (env) return env;
  const h = req.headers.get("x-forwarded-host") || req.headers.get("host") || "roun.sryze.cc";
  return "https://" + h.split(",")[0].trim().split(":")[0];
}

// POST {email} — always {ok:true} (never reveal whether the address exists).
// Own token (1h, single-use); ONE branded mail via elsemail pipe.
export async function POST(req: Request) {
  if (!csrfCheck(req)) return csrfBlock();
  const ip = clientIp(req);
  const rlIp = rateLimit("forgot_ip:" + ip, 10, 60 * 60 * 1000);
  if (!rlIp.ok) return NextResponse.json({ error: "Too many tries. Try again later." }, { status: 429 });
  const { email } = await req.json().catch(() => ({}));
  const mail = clampText(email, 120).trim().toLowerCase();
  if (!mail || !/^\S+@\S+\.\S+$/.test(mail)) return NextResponse.json({ ok: true });
  const rlMail = rateLimit("forgot_mail:" + mail, 3, 60 * 60 * 1000);
  if (!rlMail.ok) return NextResponse.json({ ok: true });
  const db = await readDb();
  const u = db.users.find((x) => x.email.toLowerCase() === mail);
  if (!u) return NextResponse.json({ ok: true });
  const token = crypto.randomBytes(32).toString("hex");
  db.resetTokens = db.resetTokens || [];
  // One live token per user — older ones die silently.
  db.resetTokens = db.resetTokens.filter((t) => t.userId !== u.id);
  db.resetTokens.push({ token, userId: u.id, expires: Date.now() + 60 * 60 * 1000, used: false });
  db.events.push({ id: uid("e"), userId: u.id, action: "reset_request", detail: u.email, at: new Date().toISOString() });
  await writeDb(db);
  const link = siteBase(req) + "/reset-password?token=" + token;
  const html = `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
<div style="background:#070a14;color:#fff;padding:20px 24px;"><div style="font-size:18px;font-weight:bold;">CodeBridge</div><div style="opacity:.7;font-size:13px;">Reset your password</div></div>
<div style="padding:24px;color:#18181b;"><p>Click below to set a new password (link valid 1 hour, one-time use):</p>
<p><a href="${link}" style="display:inline-block;background:#111827;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold;">Set new password</a></p>
<p style="color:#52525b;font-size:13px;word-break:break-all;">Or copy: ${link}</p>
<p style="color:#52525b;font-size:13px;">Didn't ask for this? Ignore — your password stays unchanged.</p></div>
</div></body></html>`;
  const sent = await sendBrandedMail(mail, "CodeBridge — reset your password", html);
  if (!sent.ok) {
    // Token without mail is useless — remove it, keep the ok-shape.
    const db2 = await readDb();
    db2.resetTokens = (db2.resetTokens || []).filter((t) => t.token !== token);
    db2.events.push({ id: uid("e"), userId: u.id, action: "reset_mail_fail", detail: sent.error || "mail failed", at: new Date().toISOString() });
    await writeDb(db2);
  }
  return NextResponse.json({ ok: true });
}
