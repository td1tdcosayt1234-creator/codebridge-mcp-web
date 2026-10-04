import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb } from "@/lib/db";
import { encToken, decToken } from "@/lib/crypto";
import { randomSecret, otpauthUrl } from "@/lib/totp";

export const dynamic = "force-dynamic";

// Start 2FA enrollment: logged in -> fresh secret + otpauth URL.
// Secret stays PENDING until /enable verifies a code (no lockout risk).
export async function POST(req: Request) {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p?.sub) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { csrfCheck, csrfBlock, rateLimit } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const rl = rateLimit("2fa_setup:" + p.sub, 10, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const db = await readDb();
  const u = db.users.find((x) => x.id === p.sub);
  if (!u) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (u.twoFaEnc && decToken(u.twoFaEnc))
    return NextResponse.json({ error: "2FA already on. Disable first to re-setup." }, { status: 400 });
  const secret = randomSecret();
  u.twoFaPending = encToken(secret);
  await writeDb(db);
  return NextResponse.json({ ok: true, secret, otpauth: otpauthUrl(secret, u.email) });
}
