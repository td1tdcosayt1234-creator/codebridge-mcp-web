import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
export const dynamic = "force-dynamic";

async function me() {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  return p as { sub: string } | null;
}

// GET /api/game/history — own game history (no HTML by default; ?full=1 includes it, ?id= loads one)
export async function GET(req: Request) {
  const p = await me();
  if (!p) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const full = url.searchParams.get("full") === "1";
  const db = await readDb();
  const mine = (db.gameHistory || []).filter((h) => h.userId === p.sub).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  if (id) {
    const h = mine.find((x) => x.id === id);
    if (!h) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, entry: h });
  }
  const list = mine.slice(0, 100).map((h) => ({
    id: h.id,
    prompt: h.prompt,
    plan: full ? h.plan : h.plan.slice(0, 300),
    provider: h.provider,
    model: h.model,
    htmlSize: h.htmlSize,
    summary: h.summary,
    createdAt: h.createdAt,
    ...(full ? { html: h.html } : {}),
  }));
  return NextResponse.json({ ok: true, count: mine.length, history: list });
}

// POST /api/game/history — save current game { prompt, plan, provider, model, html, summary }
export async function POST(req: Request) {
  const p = await me();
  if (!p) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { csrfCheck, csrfBlock, rateLimit, clientIp } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const rl = rateLimit("gamehist:" + clientIp(req), 30, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const prompt = String(body.prompt || "").slice(0, 800);
  const html = String(body.html || "");
  if (prompt.length < 2 || html.length < 800 || html.length > 300000)
    return NextResponse.json({ error: "Need prompt + valid game html." }, { status: 400 });
  const db = await readDb();
  const entry = {
    id: uid("gh"),
    userId: p.sub,
    prompt,
    plan: String(body.plan || "").slice(0, 2000),
    provider: String(body.provider || "").slice(0, 80),
    model: String(body.model || "").slice(0, 80),
    htmlSize: html.length,
    html: html.slice(0, 300000),
    summary: String(body.summary || "").slice(0, 2000),
    createdAt: new Date().toISOString(),
  };
  db.gameHistory = [...(db.gameHistory || []), entry];
  // cap 200 per user
  const mine = db.gameHistory.filter((h) => h.userId === p.sub);
  if (mine.length > 200) {
    const drop = new Set(mine.slice(0, mine.length - 200).map((h) => h.id));
    db.gameHistory = db.gameHistory.filter((h) => !drop.has(h.id));
  }
  await writeDb(db);
  return NextResponse.json({ ok: true, id: entry.id });
}

// DELETE /api/game/history?id=xxx (one) or ?all=1 (clear mine)
export async function DELETE(req: Request) {
  const p = await me();
  if (!p) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { csrfCheck, csrfBlock } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const url = new URL(req.url);
  const db = await readDb();
  if (url.searchParams.get("all") === "1") {
    db.gameHistory = (db.gameHistory || []).filter((h) => h.userId !== p.sub);
  } else {
    const id = url.searchParams.get("id") || "";
    db.gameHistory = (db.gameHistory || []).filter((h) => !(h.userId === p.sub && h.id === id));
  }
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
