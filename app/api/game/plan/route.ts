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
    const { orChat, orKeyOk, ROUN_MODEL_MAP, ROUN_DEFAULT, cleanRounModel } = await import("@/lib/openrouter");
    if (!orKeyOk())
      return NextResponse.json({ error: "AI key not configured. Set OPENROUTER_API_KEY in .env / secrets." }, { status: 503 });
    const sel = cleanRounModel(String(model || "").trim()) || ROUN_DEFAULT;
    const plan = await orChat(
      [
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
      { model: ROUN_MODEL_MAP[sel], maxTokens: 800, temperature: 0.6, timeoutMs: 90000 },
    );
    if (!plan || plan.length < 20) return NextResponse.json({ error: "Planner gave empty output — try again." }, { status: 502 });
    return NextResponse.json({ ok: true, plan: plan.slice(0, 2000), model: sel });
  } catch (e) {
    return NextResponse.json({ error: "Planner unreachable: " + String(e).slice(0, 200) }, { status: 503 });
  }
}
