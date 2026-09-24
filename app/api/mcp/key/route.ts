import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import { newPersonalKey } from "@/lib/mcpOAuth";

// Regenerate the logged-in user's personal MCP key (used as
// Authorization: Bearer <key> by their coding agent).
export async function POST(req: Request) {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { csrfCheck, csrfBlock, rateLimit } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const rl = rateLimit("mcpkey:" + p.sub, 5, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many tries. Wait a bit." }, { status: 429 });
  const db = await readDb();
  const key = newPersonalKey();
  const rec = db.mcpKeys.find((k) => k.userId === p.sub);
  if (rec) rec.key = key; else db.mcpKeys.push({ userId: p.sub, key });
  db.events.push({ id: uid("e"), userId: p.sub, action: "mcp_key_regen", detail: "personal MCP key regenerated", at: new Date().toISOString() });
  await writeDb(db);
  return NextResponse.json({ ok: true, key });
}
