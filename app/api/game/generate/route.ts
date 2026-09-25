import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { zenConfig, zenKeyOk } from "@/lib/ai";
export const dynamic = "force-dynamic";

// --- AI game generation: OpenCode Zen (admin-panel key > .env key) first, free Pollinations second. No templates. ---
function baseModels(defaultModel: string) {
  return Array.from(
    new Set([defaultModel, "muse-spark-1.3-contributor-free", "big-pickle", "mimo-v2.6-flash-free"]),
  );
}

// Free-tier models on Zen (no per-token charge) — selectable in Game Studio chat.
const FREE_MODELS = [
  "big-pickle",
  "ling-3.0-flash-fin-free",
  "mimo-v2.5-free",
  "mimo-v2.6-flash-free",
  "muse-spark-1.2-contributor-free",
  "muse-spark-1.3-contributor-free",
  "nemotron-3-ultra-free",
  "nemotron-3.5-lightning-free",
  "jev-1.13-free",
  "space-bunny-free",
];
// Only allow known models — the key owner pays for anything outside free tier.
function cleanModel(m: unknown, defaultModel: string): string {
  const s = String(m || "").slice(0, 80);
  if (!/^[A-Za-z0-9._:\/-]+$/.test(s)) return "";
  return FREE_MODELS.includes(s) || s === defaultModel ? s : "";
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
// Free shared service is flaky (slow/empty/bad output) — retry up to 3x
// before giving up, so one bad roll doesn't surface as "AI busy".
async function pollinationsGame(prompt: string, style: string, signal: AbortSignal, tries = 3): Promise<string | null> {
  for (let i = 0; i < tries; i++) {
    if (signal.aborted) return null;
    // Per-try 60s cap: one hung upstream call must not eat the whole budget.
    const tryCtrl = new AbortController();
    const tryTimer = setTimeout(() => tryCtrl.abort(), 60000);
    const onAbort = () => tryCtrl.abort();
    signal.addEventListener("abort", onAbort, { once: true });
    try {
      const res = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          temperature: 0.7,
          max_tokens: 4000,
          messages: [
            { role: "system", content: GAME_SYSTEM(style) },
            { role: "user", content: `Game idea: ${String(prompt || "").slice(0, 500)}` },
          ],
        }),
        signal: tryCtrl.signal,
      });
      if (!res.ok) {
        // 429 = free tier throttled us (often from repeated tries) — honor
        // Retry-After so we stop hammering and actually recover.
        const ra = Number(res.headers.get("retry-after") || 0);
        const waitSec = res.status === 429 ? Math.min(Math.max(ra || 15, 5), 60) : 3;
        console.warn(`[game] pollinations try ${i + 1}/${tries}: HTTP ${res.status}, waiting ${waitSec}s`);
        if (i < tries - 1 && !signal.aborted) await new Promise((r) => setTimeout(r, waitSec * 1000));
        continue;
      } else {
        const j = await res.json().catch(() => null);
        const raw: string = j?.choices?.[0]?.message?.content || "";
        const html = extractHTML(raw);
        if (looksLikeGame(html)) return html;
        console.warn(`[game] pollinations try ${i + 1}/${tries}: bad output (${raw.length} chars)`);
      }
    } catch (e) {
      console.warn(`[game] pollinations try ${i + 1}/${tries}: ${signal.aborted ? "aborted" : String(e).slice(0, 120)}`);
    } finally {
      clearTimeout(tryTimer);
      signal.removeEventListener("abort", onAbort);
    }
    if (i < tries - 1 && !signal.aborted) await new Promise((r) => setTimeout(r, 3000));
  }
  return null;
}

async function aiGameHTML(req: Request, prompt: string, style: string, preferred = ""): Promise<{ html: string; provider: string } | null> {
  const cleanPrompt = String(prompt || "").slice(0, 500);
  // Chat mode sends style:"auto" — no preset palettes, AI picks visuals to fit the idea.
  const styleLabel = !style || style === "auto" ? "AI-chosen to best match the game idea" : String(style).slice(0, 40);
  const system = GAME_SYSTEM(styleLabel);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 200000);
  // Client gave up (tab closed, navigated away)? Stop the upstream calls too.
  req.signal.addEventListener("abort", () => { try { ctrl.abort(); } catch {} });
  // Effective key: admin panel first, .env fallback. Read per request — no restart needed.
  const cfg = await zenConfig();
  const ZEN_MODELS = baseModels(cfg.model);
  try {
    // Provider 1: OpenCode Zen (admin/.env key — best quality when funded).
    // Selected chat model goes first, then the default order as fallback.
    if (zenKeyOk(cfg.key)) {
      const key = cfg.key.trim();
      const ordered = preferred ? Array.from(new Set([preferred, ...ZEN_MODELS])) : ZEN_MODELS;
      for (const model of ordered) {
        try {
          const res = await fetch(`${cfg.base}/chat/completions`, {
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
          if (!res.ok) {
            // 402 = key has no funds, 403 = free-tier blocked outside OpenCode, 429 = throttled.
            console.warn(`[game] zen ${model}: HTTP ${res.status}`);
            continue; // try next model, then provider 2
          }
          const j = await res.json().catch(() => null);
          const raw: string = j?.choices?.[0]?.message?.content || "";
          const html = extractHTML(raw);
          if (looksLikeGame(html)) return { html, provider: "zen:" + model };
          console.warn(`[game] zen ${model}: bad output (${raw.length} chars)`);
        } catch {
          continue;
        }
      }
    }
    // Provider 2: Pollinations (free, keyless) — real AI, no templates involved.
    const free = await pollinationsGame(cleanPrompt, styleLabel, ctrl.signal);
    if (free) return { html: free, provider: "pollinations" };
    console.warn("[game] all providers failed (zen 402/403 + pollinations 3x) — returning 503");
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
    const { prompt="", style="auto", model="" } = await req.json().catch(()=>({}));
    if(String(prompt||"").length>800) return NextResponse.json({error:"Prompt too long (max 800)"},{status:400});
    if(String(prompt||"").length<2) return NextResponse.json({error:"Prompt required"},{status:400});
    // Pure AI generation — no templates. Zen (admin/.env key) first, free Pollinations second.
    const cfg0 = await zenConfig();
    const ai = await aiGameHTML(req, String(prompt || ""), String(style || "auto"), cleanModel(model, cfg0.model));
    if (!ai) {
      return NextResponse.json(
        { error: "AI generation failed. The free provider may be busy — wait a minute and try again." },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok:true, html: ai.html, name:"index.html", size: ai.html.length, engine: "ai", provider: ai.provider });
  }catch(e){ return NextResponse.json({ error: String(e) }, {status:500})}
}
export async function GET(){
  const cfg = await zenConfig();
  const ok = zenKeyOk(cfg.key);
  return NextResponse.json({ ok:true, service:"game-generate", ai: ok, model: ok ? cfg.model : undefined, source: ok ? cfg.source : "none", freeModels: FREE_MODELS });
}
