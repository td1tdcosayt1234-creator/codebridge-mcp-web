import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import { encToken } from "@/lib/crypto";
import { ZEN_DEFAULT_BASE, ZEN_DEFAULT_MODEL } from "@/lib/ai";

async function admin() {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p || p.role !== "admin") return null;
  return p;
}

// Admin-managed global AI key (OpenCode Zen / OpenAI-compatible) for Game Studio.
// Priority: admin-panel key > .env OPENCODE_API_KEY. Takes effect immediately, no restart.
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
    envKeySet: (process.env.OPENCODE_API_KEY || "").trim().length > 10,
  });
}

export async function POST(req: Request) {
  const p = await admin();
  if (!p) return NextResponse.json({ error: "admin only" }, { status: 403 });
  const { csrfCheck, csrfBlock } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const { key, baseUrl, model } = await req.json().catch(() => ({}));
  const k = String(key || "").trim();
  if (k.length < 12) return NextResponse.json({ error: "Paste a valid API key (min 12 chars)." }, { status: 400 });
  const base = String(baseUrl || ZEN_DEFAULT_BASE).trim().replace(/\/+$/, "") || ZEN_DEFAULT_BASE;
  try {
    new URL(base);
  } catch {
    return NextResponse.json({ error: "Base URL is not valid." }, { status: 400 });
  }
  const m = String(model || ZEN_DEFAULT_MODEL).trim().slice(0, 80) || ZEN_DEFAULT_MODEL;
  // Live-verify before saving so a dead key never becomes the active one.
  try {
    const r = await fetch(base + "/models", { headers: { Authorization: "Bearer " + k } });
    if (!r.ok) return NextResponse.json({ error: "Key rejected by server (HTTP " + r.status + "). Check key + base URL." }, { status: 400 });
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
  const { csrfCheck, csrfBlock } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const db = await readDb();
  db.globalAI = undefined;
  db.events.push({ id: uid("e"), userId: p.sub, action: "admin_ai_key_remove", detail: "global AI key removed, .env fallback active", at: new Date().toISOString() });
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
