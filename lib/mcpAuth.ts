import { readDb, writeDb, uid, type DbShape, type PendingCall } from "./db";
export type { PendingCall, ApprovalState } from "./db";

// Public web origin built from the request Host header (never the server's
// bound address like 0.0.0.0) so browser links are actually clickable.
export function webOrigin(req: Request): string {
  const proto = (req.headers.get("x-forwarded-proto") || "").split(",")[0].trim() || "http";
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim();
  if (host) return proto + "://" + host;
  return new URL(req.url).origin;
}

export const APPROVAL_TTL_MS = 10 * 60 * 1000;

function pruneDb(db: DbShape): boolean {
  if (!db.approvals) { db.approvals = []; return true; }
  const cut = Date.now() - APPROVAL_TTL_MS;
  const kept = db.approvals.filter((p) => p.createdAt >= cut);
  if (kept.length !== db.approvals.length) { db.approvals = kept; return true; }
  return false;
}

export async function createPending(tool: string, args: Record<string, unknown>, fp: { ip: string; ua: string }): Promise<PendingCall> {
  const db = await readDb();
  pruneDb(db);
  const p: PendingCall = {
    id: "appr_" + Math.random().toString(36).slice(2, 12),
    tool, args, state: "waiting", createdAt: Date.now(), fp,
  };
  db.approvals.push(p);
  await writeDb(db);
  return p;
}

export async function getPending(id: string): Promise<PendingCall | undefined> {
  const db = await readDb();
  pruneDb(db); // best-effort cleanup; don't write here to avoid a
  // write-vs-read race with settlePending on the same approval.
  return db.approvals.find((p) => p.id === String(id || ""));
}

export async function settlePending(id: string, userId: string | null): Promise<PendingCall | undefined> {
  const db = await readDb();
  const p = db.approvals.find((x) => x.id === String(id || ""));
  if (!p || p.state !== "waiting") return undefined;
  if (userId) { p.state = "approved"; p.userId = userId; }
  else p.state = "denied";
  await writeDb(db);
  return p;
}

export async function dropPending(id: string) {
  const db = await readDb();
  const n = db.approvals.length;
  db.approvals = db.approvals.filter((x) => x.id !== String(id || ""));
  if (db.approvals.length !== n) await writeDb(db);
}

// ---- Trusted agents ("approve once, never again") ----
// After a one-time browser approval the agent's fingerprint (IP + User-Agent
// seen on its MCP calls) can be remembered, so later calls run directly.
// Entries expire after 90 days and can be revoked anytime in /dashboard/mcp.
export const TRUST_TTL_MS = 90 * 24 * 3600 * 1000;

export function agentFp(req: Request, clientIp: string): { ip: string; ua: string } {
  return { ip: clientIp, ua: (req.headers.get("user-agent") || "").slice(0, 120) };
}

function fpMatch(a: { ip: string; ua: string }, b: { ip: string; ua: string }): boolean {
  if (!a.ip || a.ip !== b.ip) return false;
  if (a.ua || b.ua) return a.ua === b.ua;
  return true;
}

export async function findTrusted(fp: { ip: string; ua: string }): Promise<{ userId: string } | null> {
  const db = await readDb();
  const now = Date.now();
  const hit = (db.trusted || []).find((t) => new Date(t.expiresAt).getTime() > now && fpMatch({ ip: t.ip, ua: t.ua }, fp));
  if (!hit) return null;
  if (!db.users.some((u) => u.id === hit.userId)) return null;
  hit.lastUsed = new Date().toISOString();
  await writeDb(db);
  return { userId: hit.userId };
}

export async function addTrusted(userId: string, fp: { ip: string; ua: string }, tool: string) {
  const db = await readDb();
  const now = new Date().toISOString();
  const old = db.trusted.find((t) => t.userId === userId && t.ip === fp.ip && t.ua === fp.ua);
  if (old) {
    old.lastUsed = now;
    old.expiresAt = new Date(Date.now() + TRUST_TTL_MS).toISOString();
  } else {
    db.trusted.push({ id: uid("ta"), userId, ip: fp.ip, ua: fp.ua, tool, createdAt: now, lastUsed: now, expiresAt: new Date(Date.now() + TRUST_TTL_MS).toISOString() });
  }
  db.events.push({ id: uid("e"), userId, action: "mcp_trust", detail: "agent trusted (" + fp.ip + ")", at: now });
  await writeDb(db);
}

export async function listTrusted(userId: string) {
  const db = await readDb();
  return db.trusted.filter((t) => t.userId === userId);
}

export async function revokeTrusted(userId: string, id: string): Promise<boolean> {
  const db = await readDb();
  const n = db.trusted.length;
  db.trusted = db.trusted.filter((t) => !(t.id === String(id) && t.userId === userId));
  if (db.trusted.length === n) return false;
  db.events.push({ id: uid("e"), userId, action: "mcp_untrust", detail: String(id), at: new Date().toISOString() });
  await writeDb(db);
  return true;
}
