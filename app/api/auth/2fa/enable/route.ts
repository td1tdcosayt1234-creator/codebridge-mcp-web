import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import { decToken } from "@/lib/crypto";
import { totpVerify, newBackupCodes } from "@/lib/totp";

export const dynamic = "force-dynamic";

// Confirm enrollment: verify a code against the PENDING secret, then activate.
// Returns 10 single-use backup codes (shown ONCE).
export async function POST(req: Request) {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p?.sub) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { csrfCheck, csrfBlock, rateLimit, clientIp } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const rl = rateLimit("2fa_enable:" + p.sub, 10, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many tries." }, { status: 429 });
  const { code } = await req.json().catch(() => ({}));
  const db = await readDb();
  const u = db.users.find((x) => x.id === p.sub);
  if (!u) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const pending = u.twoFaPending ? decToken(u.twoFaPending) : "";
  if (!pending) return NextResponse.json({ error: "Call setup first." }, { status: 400 });
  if (!totpVerify(pending, String(code || ""))) {
    const { recordViolation } = await import("@/lib/security");
    recordViolation(clientIp(req), 1);
    return NextResponse.json({ error: "Wrong code. Check your authenticator time." }, { status: 400 });
  }
  const { encToken } = await import("@/lib/crypto");
  const { plain, hashes } = newBackupCodes();
  u.twoFaEnc = encToken(pending);
  u.twoFaPending = undefined;
  u.twoFaBackup = hashes;
  u.twoFaAt = new Date().toISOString();
  db.events.push({ id: uid("e"), userId: u.id, action: "2fa_enabled", detail: u.email, at: new Date().toISOString() });
  await writeDb(db);
  return NextResponse.json({ ok: true, backup: plain });
}
