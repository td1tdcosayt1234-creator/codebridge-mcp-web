import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import { decToken } from "@/lib/crypto";
import { totpVerify, backupMatches } from "@/lib/totp";

export const dynamic = "force-dynamic";

// Disable 2FA: requires a valid TOTP (or backup) code. Admins get a loud log.
export async function POST(req: Request) {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p?.sub) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { csrfCheck, csrfBlock, rateLimit } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const rl = rateLimit("2fa_disable:" + p.sub, 10, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many tries." }, { status: 429 });
  const { code } = await req.json().catch(() => ({}));
  const db = await readDb();
  const u = db.users.find((x) => x.id === p.sub);
  if (!u) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const secret = u.twoFaEnc ? decToken(u.twoFaEnc) : "";
  if (!secret) return NextResponse.json({ error: "2FA is not on." }, { status: 400 });
  const c = String(code || "");
  let ok = totpVerify(secret, c);
  if (!ok) {
    const idx = (u.twoFaBackup || []).findIndex((h) => backupMatches(h, c));
    ok = idx >= 0;
  }
  if (!ok) return NextResponse.json({ error: "Wrong code." }, { status: 400 });
  u.twoFaEnc = undefined;
  u.twoFaPending = undefined;
  u.twoFaBackup = [];
  u.twoFaAt = undefined;
  db.events.push({ id: uid("e"), userId: u.id, action: "2fa_disabled", detail: u.email + (u.role === "admin" ? " (ADMIN 2FA OFF)" : ""), at: new Date().toISOString() });
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
