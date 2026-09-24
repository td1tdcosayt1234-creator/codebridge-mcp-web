import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
export const dynamic = "force-dynamic";

// --- AI game generation: OpenCode Zen (user key) first, free Pollinations second. No templates. ---
const ZEN_BASE = (process.env.OPENCODE_BASE_URL || "https://opencode.ai/zen/v1").replace(/\/+$/, "");
const ZEN_MODEL = process.env.OPENCODE_MODEL || "gpt-5.4-mini";

// Paid default first (best quality); free models as fallback if the account has no balance.
const ZEN_MODELS = Array.from(
  new Set([ZEN_MODEL, "muse-spark-1.3-contributor-free", "big-pickle", "mimo-v2.6-flash-free"]),
);

function aiConfigured(): boolean {
  return (process.env.OPENCODE_API_KEY || "").trim().length > 10;
}

function extractHTML(raw: string): string {
  let s = (raw || "").trim();
  if (!s) return "";
  // Strip markdown fences if the model wrapped the HTML.
  const fence = s.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) s = fence[1].trim();
  return s;
}

function looksLikeGame(html: string): boolean {
  if (html.length < 800 || html.length > 200000) return false;
  const lower = html.toLowerCase();
  return lower.includes("<html") && (lower.includes("<canvas") || lower.includes("<script"));
}

const GAME_SYSTEM = (style: string) =>
  [
    "You generate a complete, playable, single-file HTML5 game.",
    "Output ONLY raw HTML — no markdown, no fences, no explanation.",
    "Rules:",
    "- One self-contained file: inline <style> and <script>, no external URLs, no CDNs, no images.",
    "- Use <canvas> for gameplay. Support keyboard (arrows/WASD/space) AND touch/swipe.",
    "- Include a visible score / HUD, a start or restart control, and a game-over state.",
    "- Keep it under ~1200 lines. Must run by just opening the file in a browser.",
    `- Visual style: ${style || "neon"} (neon glow / retro arcade / minimal clean). Dark background.`,
  ].join("\n");

// Provider 2: Pollinations (free, keyless, OpenAI-compatible). No account needed.
async function pollinationsGame(prompt: string, style: string, signal: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        temperature: 0.7,
        max_tokens: 6000,
        messages: [
          { role: "system", content: GAME_SYSTEM(style) },
          { role: "user", content: `Game idea: ${String(prompt || "").slice(0, 500)}` },
        ],
      }),
      signal,
    });
    if (!res.ok) return null;
    const j = await res.json().catch(() => null);
    const raw: string = j?.choices?.[0]?.message?.content || "";
    const html = extractHTML(raw);
    return looksLikeGame(html) ? html : null;
  } catch {
    return null;
  }
}

async function aiGameHTML(req: Request, prompt: string, style: string): Promise<{ html: string; provider: string } | null> {
  const cleanPrompt = String(prompt || "").slice(0, 500);
  const system = GAME_SYSTEM(style);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120000);
  // Client gave up (tab closed, navigated away)? Stop the upstream calls too.
  req.signal.addEventListener("abort", () => { try { ctrl.abort(); } catch {} });
  try {
    // Provider 1: OpenCode Zen (user key — best quality when funded).
    if (aiConfigured()) {
      const key = (process.env.OPENCODE_API_KEY || "").trim();
      for (const model of ZEN_MODELS) {
        try {
          const res = await fetch(`${ZEN_BASE}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
              model,
              temperature: 0.7,
              max_tokens: 6000,
              messages: [
                { role: "system", content: system },
                { role: "user", content: `Game idea: ${cleanPrompt}` },
              ],
            }),
            signal: ctrl.signal,
          });
          if (!res.ok) continue; // 402/403/429 → try next model, then provider 2
          const j = await res.json().catch(() => null);
          const raw: string = j?.choices?.[0]?.message?.content || "";
          const html = extractHTML(raw);
          if (looksLikeGame(html)) return { html, provider: "zen:" + model };
        } catch {
          continue;
        }
      }
    }
    // Provider 2: Pollinations (free, keyless) — real AI, no templates involved.
    const free = await pollinationsGame(cleanPrompt, style, ctrl.signal);
    if (free) return { html: free, provider: "pollinations" };
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
export async function POST(req: Request){
  // Login required (mirrors /game page gate).
  const t = cookies().get("session")?.value || "";
  const user = await verifyJwt(t);
  if(!user) return NextResponse.json({error:"Login required"},{status:401});
  const { rateLimit, csrfCheck, csrfBlock } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  // Unthrottled AI calls = unbounded cost: max 5 generations/min per user.
  const rl = rateLimit("gamegen:" + user.sub, 5, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many generations. Wait " + rl.retryAfterSec + "s." }, { status: 429 });
  // Rate limit: 30 req/min per IP (simple in-memory) - prevents abuse
  try{
    const { prompt="", style="neon" } = await req.json().catch(()=>({}));
    if(String(prompt||"").length>800) return NextResponse.json({error:"Prompt too long (max 800)"},{status:400});
    if(String(prompt||"").length<2) return NextResponse.json({error:"Prompt required"},{status:400});
    // Pure AI generation — no templates. Zen (user key) first, free Pollinations second.
    const ai = await aiGameHTML(req, String(prompt || ""), String(style || "neon"));
    if (!ai) {
      return NextResponse.json(
        { error: "AI generation failed. The free provider may be busy — wait a minute and try again." },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok:true, html: ai.html, name:"index.html", size: ai.html.length, engine: "ai", provider: ai.provider });
  }catch(e){ return NextResponse.json({ error: String(e) }, {status:500})}
}
export async function GET(){ return NextResponse.json({ ok:true, service:"game-generate", ai: aiConfigured(), model: aiConfigured() ? ZEN_MODEL : undefined });}
