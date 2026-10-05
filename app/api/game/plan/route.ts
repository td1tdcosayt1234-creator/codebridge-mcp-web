import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
export const dynamic = "force-dynamic";

// POST /api/game/plan — AI game plan BEFORE building.
// Body: { prompt, model? } -> { ok, plan }
export async function POST(req: Request) {
  const t = cookies().get("session")?.value || "";
  const user = await verifyJwt(t);
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { rateLimit, csrfCheck, csrfBlock } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const rl = rateLimit("gameplan:" + (user as { sub: string }).sub, 10, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many plans. Wait " + rl.retryAfterSec + "s." }, { status: 429 });
  const { prompt = "", model = "" } = await req.json().catch(() => ({} as Record<string, unknown>));
  const idea = String(prompt || "").slice(0, 800);
  if (idea.length < 2) return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  try {
    const { zenConfig, zenKeyOk } = await import("@/lib/ai");
    const cfg = await zenConfig();
    if (!zenKeyOk(cfg.key))
      return NextResponse.json({ error: "AI key not configured. Set OPENCODE_API_KEY in .env or /admin/ai." }, { status: 503 });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 90000);
    try {
      const r = await fetch(cfg.base.replace(/\/+$/, "") + "/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + cfg.key },
        body: JSON.stringify({
          model: String(model || "").trim() || cfg.model || "hl",
          messages: [
            {
              role: "system",
              content: [
                "You are Game Studio planner. Given a game idea, output a SHORT build plan in plain text (no code).",
                "Format exactly:",
                "🎮 Title: <name>",
                "🎯 Goal: <1 line>",
                "🕹 Controls: <keyboard + touch>",
                "✨ Features: <4-6 comma items: score, levels, particles, sfx, difficulty, game-over>",
                "📋 Steps: <1) 2) 3) short build order>",
                "Keep it under 900 chars. Same language as the idea (Bengali mix if Bengali).",
              ].join("\n"),
            },
            { role: "user", content: `Game idea: ${idea}\nWrite the plan.` },
          ],
          temperature: 0.6,
          max_tokens: 800,
        }),
        signal: ctrl.signal,
      });
      if (!r.ok) return NextResponse.json({ error: "Planner failed (HTTP " + r.status + ")." }, { status: 502 });
      const j = await r.json().catch(() => ({}));
      const plan: string = j?.choices?.[0]?.message?.content?.trim() || "";
      if (plan.length < 20) return NextResponse.json({ error: "Planner gave empty output — try again." }, { status: 502 });
      return NextResponse.json({ ok: true, plan: plan.slice(0, 2000), model: cfg.model });
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    return NextResponse.json({ error: "Planner unreachable: " + String(e).slice(0, 200) }, { status: 503 });
  }
}
