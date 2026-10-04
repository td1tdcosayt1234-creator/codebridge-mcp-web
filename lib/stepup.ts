import { readDb, writeDb, uid } from "./db";
import { decToken } from "./crypto";
import { totpVerify, backupMatches } from "./totp";

// Tier-2: TOTP step-up for money/power actions.
// - Users WITH 2FA: sensitive actions must send a fresh code
//   (header x-2fa-code or body._2fa). Backup codes accepted once.
// - Admins WITHOUT 2FA: sensitive actions rejected with needEnroll
//   (forces enrollment; password alone can no longer move money/keys).

export function stepupInput(req: Request, body: unknown): string {
  const h = (req.headers.get("x-2fa-code") || "").trim();
  if (h) return h.slice(0, 16);
  if (body && typeof body === "object") {
    const b = String((body as Record<string, unknown>)._2fa || "").trim();
    if (b) return b.slice(0, 16);
  }
  return "";
}

export async function stepupEnrolled(userId: string): Promise<boolean> {
  const db = await readDb();
  const u = db.users.find((x) => x.id === userId);
  return !!(u?.twoFaEnc && decToken(u.twoFaEnc));
}

// Returns ok:true, or {ok:false, needEnroll} / {ok:false, needCode}.
export async function requireStepUp(userId: string, code: string, opts?: { admin?: boolean }): Promise<{ ok: true } | { ok: false; needEnroll?: boolean; needCode?: boolean }> {
  const db = await readDb();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return { ok: false, needCode: true };
  const secret = u.twoFaEnc ? decToken(u.twoFaEnc) : "";
  if (!secret) {
    // Admins must enroll before touching money/keys. Users may proceed
    // (their session is tier-1); enabling 2FA upgrades them to tier-2.
    if (opts?.admin || u.role === "admin") return { ok: false, needEnroll: true };
    return { ok: true };
  }
  if (!code) return { ok: false, needCode: true };
  if (totpVerify(secret, code)) {
    db.events.push({ id: uid("e"), userId, action: "2fa_stepup", detail: "step-up ok", at: new Date().toISOString() });
    await writeDb(db);
    return { ok: true };
  }
  // Backup code path (single-use).
  const idx = (u.twoFaBackup || []).findIndex((hh) => backupMatches(hh, code));
  if (idx >= 0) {
    u.twoFaBackup = (u.twoFaBackup || []).filter((_, i) => i !== idx);
    db.events.push({ id: uid("e"), userId, action: "2fa_backup_used", detail: (u.twoFaBackup || []).length + " left", at: new Date().toISOString() });
    await writeDb(db);
    return { ok: true };
  }
  db.events.push({ id: uid("e"), userId, action: "2fa_stepup_fail", detail: "bad step-up code", at: new Date().toISOString() });
  await writeDb(db);
  return { ok: false, needCode: true };
}
