import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import { encToken } from "@/lib/crypto";
import { OPENROUTER_BASE, ROUN_DEFAULT, cleanRounModel } from "@/lib/openrouter";

async function admin() {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p?.sub) return null;
  // Never trust stale JWT role: re-read from DB.
  const { readDb } = await import("@/lib/db");
  const db = await readDb();
  const u = db.users.find((x) => x.id === p.sub);
  if (!u || u.role !== "admin") return null;
  return { ...p, email: u.email, role: "admin" as const };
}

// Admin-managed global AI key (Roun Co Pilot / OpenRouter free models) for Game Studio.
// Priority: admin-panel key > .env OPENROUTER_API_KEY. Takes effect immediately, no restart.
export async function GET() {
  const p = await admin();
  if (!p) return NextResponse.json({ error: "admin only" }, { status: 403 });
  const db = await readDb();
  return NextResponse.json({
    configured: !!db.globalAI?.enc,
    model: db.globalAI?.model || "",
    baseUrl: db.globalAI?.baseUrl || "",
    masked: db.globalAI?.enc ? "saved (hidden)" : "",
    updatedBy: db.globalAI?.updatedBy || "",
    updatedAt: db.globalAI?.updatedAt || "",
    envKeySet: (process.env.OPENROUTER_API_KEY || "").trim().length > 10,
  });
}

export async function POST(req: Request) {
  const p = await admin();
  if (!p) return NextResponse.json({ error: "admin only" }, { status: 403 });
  const { csrfCheck, csrfBlock, rateLimit, clientIp } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const rl = rateLimit("admin_ai:" + clientIp(req), 20, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const { key, baseUrl, model } = body as Record<string, unknown>;
  // Tier-2: global AI key affects all Game Studio output — 2FA mandatory.
  const { stepupInput, requireStepUp } = await import("@/lib/stepup");
  const step = await requireStepUp(String((p as Record<string, unknown>).sub), stepupInput(req, body), { admin: true });
  if (!step.ok)
    return NextResponse.json(
      { error: (step as { needEnroll?: boolean }).needEnroll ? "Enable 2FA in /dashboard/settings first." : "Fresh 2FA code required (x-2fa-code)." },
      { status: 403 }
    );
  const k = String(key || "").trim();
  if (k.length < 12) return NextResponse.json({ error: "Paste a valid API key (min 12 chars)." }, { status: 400 });
  const base = String(baseUrl || OPENROUTER_BASE).trim().replace(/\/+$/, "") || OPENROUTER_BASE;
  let parsed: URL;
  try {
    parsed = new URL(base);
  } catch {
    return NextResponse.json({ error: "Base URL is not valid." }, { status: 400 });
  }
  // SSRF guard: admin key verify must never probe internal networks.
  // Only public https hosts (localhost allowed for dev).
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1")
    return NextResponse.json({ error: "Base URL must be https." }, { status: 400 });
  const m = cleanRounModel(String(model || "").trim()) || ROUN_DEFAULT;
  // Live-verify before saving so a dead key never becomes the active one.
  // OpenRouter key check first, generic /models fallback for custom bases.
  try {
    let ok = false;
    try {
      const rk = await fetch(base + "/auth/key", { headers: { Authorization: "Bearer " + k } });
      if (rk.ok) ok = true;
    } catch { /* try /models next */ }
    if (!ok) {
      const r = await fetch(base + "/models", { headers: { Authorization: "Bearer " + k } });
      if (!r.ok) return NextResponse.json({ error: "Key rejected by server (HTTP " + r.status + "). Check key + base URL." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "AI server unreachable. Check base URL / network." }, { status: 400 });
  }
  const db = await readDb();
  db.globalAI = { enc: encToken(k), baseUrl: base, model: m, updatedBy: p.email || p.sub, updatedAt: new Date().toISOString() };
  db.events.push({ id: uid("e"), userId: p.sub, action: "admin_ai_key_save", detail: "global AI key updated by " + (p.email || p.sub), at: new Date().toISOString() });
  await writeDb(db);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const p = await admin();
  if (!p) return NextResponse.json({ error: "admin only" }, { status: 403 });
  const { csrfCheck, csrfBlock, rateLimit, clientIp } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const rl = rateLimit("admin_ai:" + clientIp(req), 20, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const { stepupInput, requireStepUp } = await import("@/lib/stepup");
  const step = await requireStepUp(String((p as Record<string, unknown>).sub), stepupInput(req, null), { admin: true });
  if (!step.ok)
    return NextResponse.json(
      { error: (step as { needEnroll?: boolean }).needEnroll ? "Enable 2FA in /dashboard/settings first." : "Fresh 2FA code required (x-2fa-code)." },
      { status: 403 }
    );
  const db = await readDb();
  db.globalAI = undefined;
  db.events.push({ id: uid("e"), userId: p.sub, action: "admin_ai_key_remove", detail: "global AI key removed, .env fallback active", at: new Date().toISOString() });
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
