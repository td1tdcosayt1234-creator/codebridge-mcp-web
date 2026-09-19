import { readDb, writeDb, type DbShape, type PendingCall } from "./db";
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

export async function createPending(tool: string, args: Record<string, unknown>): Promise<PendingCall> {
  const db = await readDb();
  pruneDb(db);
  const p: PendingCall = {
    id: "appr_" + Math.random().toString(36).slice(2, 12),
    tool, args, state: "waiting", createdAt: Date.now(),
  };
  db.approvals.push(p);
  await writeDb(db);
  return p;
}

export async function getPending(id: string): Promise<PendingCall | undefined> {
  const db = await readDb();
  if (pruneDb(db)) await writeDb(db);
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
