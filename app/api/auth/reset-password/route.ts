import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readDb, writeDb, uid } from "@/lib/db";
import { rateLimit, clientIp, passwordError, csrfCheck, csrfBlock } from "@/lib/security";

// POST {token, newPassword} — single-use 1h token, sets bcrypt hash,
// clears lockout so a locked account recovers through its mailbox.
export async function POST(req: Request) {
  if (!csrfCheck(req)) return csrfBlock();
  const ip = clientIp(req);
  const rl = rateLimit("reset_pw:" + ip, 20, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many tries. Try again later." }, { status: 429 });
  const { token, newPassword } = await req.json().catch(() => ({}));
  const tok = String(token || "").slice(0, 128);
  if (!tok) return NextResponse.json({ error: "Reset link invalid. Request a new one." }, { status: 400 });
  const pwErr = passwordError(String(newPassword || ""));
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });
  if (String(newPassword).length > 128) return NextResponse.json({ error: "Password too long (max 128 characters)." }, { status: 400 });
  const db = await readDb();
  const rec = (db.resetTokens || []).find((t) => t.token === tok);
  if (!rec || rec.used || rec.expires < Date.now())
    return NextResponse.json({ error: "Link expired or already used. Request a new one." }, { status: 400 });
  const u = db.users.find((x) => x.id === rec.userId);
  if (!u) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  rec.used = true;
  u.passHash = await bcrypt.hash(String(newPassword), 12);
  db.attempts = db.attempts.filter((a) => a.email !== u.email);
  db.events.push({ id: uid("e"), userId: u.id, action: "reset_done", detail: u.email, at: new Date().toISOString() });
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
