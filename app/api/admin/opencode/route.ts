import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { opencodeHome, OPENCODE_FREE_MODELS, OPENCODE_DEFAULT_MODEL } from "@/lib/opencode";
import { ZEN_DEFAULT_BASE } from "@/lib/ai";

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

function authPath() {
  return path.join(opencodeHome(), "opencode", "auth.json");
}

async function cliVersion(): Promise<string> {
  const candidates = [
    process.env.OPENCODE_BIN || "",
    "C:\\npm\\prefix\\node_modules\\opencode-ai\\bin\\opencode.exe",
    "/usr/local/bin/opencode",
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      const v: string = await new Promise((resolve) => {
        execFile(c, ["--version"], { timeout: 15000, windowsHide: true }, (err, stdout) =>
          resolve(err ? "" : String(stdout || "").trim()),
        );
      });
      if (v) return v.split("\n")[0].slice(0, 40);
    } catch {
      /* try next */
    }
  }
  return "";
}

async function loggedIn(): Promise<boolean> {
  try {
    const raw = await fs.readFile(authPath(), "utf8");
    return raw.trim().length > 10;
  } catch {
    return false;
  }
}

// Admin-managed opencode CLI login (free Zen models for Game Studio).
// The CLI prompt needs a real TTY, so the panel writes auth.json directly
// (verified live first) — same credential the CLI itself stores.
export async function GET() {
  const p = await admin();
  if (!p) return NextResponse.json({ error: "admin only" }, { status: 403 });
  const version = await cliVersion();
  return NextResponse.json({
    installed: version.length > 0,
    version,
    loggedIn: await loggedIn(),
    home: opencodeHome(),
    defaultModel: process.env.OPENCODE_MODEL || OPENCODE_DEFAULT_MODEL,
    freeModels: OPENCODE_FREE_MODELS,
  });
}

export async function POST(req: Request) {
  const p = await admin();
  if (!p) return NextResponse.json({ error: "admin only" }, { status: 403 });
  const { csrfCheck, csrfBlock, rateLimit, clientIp } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const rl = rateLimit("admin_oc:" + clientIp(req), 20, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const { key } = await req.json().catch(() => ({}));
  const k = String(key || "").trim();
  if (k.length < 12) return NextResponse.json({ error: "Paste a valid API key (min 12 chars)." }, { status: 400 });
  // Live-verify before saving so a dead key never becomes the active one.
  try {
    const r = await fetch(ZEN_DEFAULT_BASE + "/models", { headers: { Authorization: "Bearer " + k } });
    if (!r.ok) return NextResponse.json({ error: "Key rejected by opencode.ai (HTTP " + r.status + "). Get a key at https://opencode.ai/auth" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "opencode.ai unreachable. Check network." }, { status: 400 });
  }
  await fs.mkdir(path.dirname(authPath()), { recursive: true });
  await fs.writeFile(authPath(), JSON.stringify({ opencode: { type: "api", key: k } }), { mode: 0o600 });
  const db = await readDb();
  db.events.push({ id: uid("e"), userId: p.sub, action: "admin_opencode_login", detail: "opencode CLI logged in by " + (p.email || p.sub), at: new Date().toISOString() });
  await writeDb(db);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const p = await admin();
  if (!p) return NextResponse.json({ error: "admin only" }, { status: 403 });
  const { csrfCheck, csrfBlock, rateLimit, clientIp } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const rl = rateLimit("admin_oc:" + clientIp(req), 20, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  try {
    await fs.rm(authPath(), { force: true });
  } catch {
    /* already gone */
  }
  const db = await readDb();
  db.events.push({ id: uid("e"), userId: p.sub, action: "admin_opencode_logout", detail: "opencode CLI logged out, kilo fallback active", at: new Date().toISOString() });
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
