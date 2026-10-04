import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { decToken } from "@/lib/crypto";

export const dynamic = "force-dynamic";

// Logged-in 2FA state (for settings UI). Never leaks secrets.
export async function GET() {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p?.sub) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const db = await readDb();
  const u = db.users.find((x) => x.id === p.sub);
  if (!u) return NextResponse.json({ error: "Login required" }, { status: 401 });
  return NextResponse.json({
    ok: true,
    enrolled: !!(u.twoFaEnc && decToken(u.twoFaEnc)),
    backupLeft: (u.twoFaBackup || []).length,
    since: u.twoFaAt || "",
  });
}
