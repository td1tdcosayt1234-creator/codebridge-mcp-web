import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
export const dynamic = "force-dynamic";

// --- AI game generation: Kilo Code only. No templates, no other providers. ---
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
  const s = String(m || "").slice(0, 120);
  if (!/^[A-Za-z0-9._:\/-]+$/.test(s)) return "";
  if (FREE_MODELS.includes(s) || s === defaultModel) return s;
  // Kilo CLI + opencode CLI free models pass through to their providers.
  // Each provider re-validates against its own allow-list (lib/kilo.ts, lib/opencode.ts).
  if (s.startsWith("kilo/") || s.startsWith("opencode/")) return s;
  return "";
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
    "Game feel (cool-html-game skill) — ALL required, keep each tiny:",
    "- Particles on score/death (cap ~200), trauma-based screen shake, 80ms hit-stop on big moments.",
    "- 2-layer parallax background, shadowBlur glow on player/pickups, floating '+N' score popups.",
    "- Combo multiplier for quick successive scores (resets after 2s idle).",
    "- WebAudio beep(freq,dur) SFX for eat/shoot/hit/win (AudioContext on first gesture) + M mute key.",
    "- Difficulty ramps with score (speed/spawn), LEVEL UP flash, forgiving first 10s.",
    "- Best score in localStorage. Fixed-timestep logic so speed is device-independent.",
  ].join("\n");

async function aiGameHTML(req: Request, prompt: string, style: string, preferred = ""): Promise<{ html: string; provider: string } | null> {
  const cleanPrompt = String(prompt || "").slice(0, 500);
  // Chat mode sends style:"auto" — no preset palettes, AI picks visuals to fit the idea.
  const styleLabel = !style || style === "auto" ? "AI-chosen to best match the game idea" : String(style).slice(0, 40);
  const system = GAME_SYSTEM(styleLabel);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 200000);
  // Client gave up (tab closed, navigated away)? Stop the upstream calls too.
  req.signal.addEventListener("abort", () => { try { ctrl.abort(); } catch {} });
  // Strict model routing: a user-selected model ALWAYS wins — no silent fallback
  // to another provider's model. Auto ("") keeps opencode-first, kilo-fallback.
  const wantOC = preferred.startsWith("opencode/");
  const wantKilo = preferred.startsWith("kilo/");
  try {
    // Provider 1: opencode CLI (free Zen models after one `opencode auth login`).
    if (!wantKilo) {
      try {
        const { opencodeGameHTML, OPENCODE_DEFAULT_MODEL } = await import("@/lib/opencode");
        const ocModel = wantOC ? preferred : OPENCODE_DEFAULT_MODEL;
        const oc = await opencodeGameHTML(cleanPrompt, styleLabel, system, ocModel);
        if (oc) return oc;
      } catch {
        /* opencode CLI unavailable / not logged in / bad output */
      }
      // User explicitly picked an opencode model — never silently build with kilo instead.
      if (wantOC) {
        console.warn("[game] selected opencode model failed — returning 503 (no cross-provider fallback)");
        return null;
      }
    }
    // Provider 2: Kilo Code CLI (free Gateway models, keyless anonymous works).
    if (!wantOC) {
      try {
        const { kiloGameHTML, KILO_DEFAULT_MODEL } = await import("@/lib/kilo");
        const kiloModel = wantKilo ? preferred : KILO_DEFAULT_MODEL;
        // Auto mode: free routes stall ~50% of the time, so rotate 3 models.
        // Selected mode: ONLY the chosen model, retried (never another model).
        const tries = wantKilo
          ? [kiloModel, kiloModel]
          : Array.from(new Set([kiloModel, "kilo/cohere/north-mini-code:free", "kilo/thinkingmachines/inkling-small:free"]));
        for (let attempt = 0; attempt < tries.length; attempt++) {
          const kilo = await kiloGameHTML(cleanPrompt, styleLabel, system, tries[attempt]);
          if (kilo) return kilo;
          console.warn(`[game] kilo attempt ${attempt + 1}/${tries.length} (${tries[attempt]}) failed`);
        }
      } catch {
        /* Kilo CLI unavailable or bad output */
      }
    }
    console.warn("[game] all providers failed (opencode + kilo) — returning 503");
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
    const rawModel = String(model || "").trim();
    // Enforce model allow-list: key owner pays for non-free models.
    if (rawModel) {
      const { OPENCODE_DEFAULT_MODEL } = await import("@/lib/opencode");
      const cleaned = cleanModel(rawModel, OPENCODE_DEFAULT_MODEL);
      if (!cleaned) return NextResponse.json({ error: "Unknown model." }, { status: 400 });
    }
    // Pure AI generation — no templates. Kilo Code only.
    // Cloudflare Tunnel kills requests >100s (524), so run async: client polls GET ?job=id.
    const { uid } = await import("@/lib/db");
    const id = uid("job");
    startJob(id, String(user.sub), String(prompt || ""), String(style || "auto"), rawModel, req);
    return NextResponse.json({ ok: true, job: true, id });
  }catch(e){ return NextResponse.json({ error: String(e) }, {status:500})}
}

// In-memory game-generation jobs. Lost on restart (acceptable: client shows error and user retries).
const jobs = new Map<string, { owner: string; status: "running" | "done" | "error"; html?: string; provider?: string; error?: string; at: number }>();
function startJob(id: string, owner: string, prompt: string, style: string, model: string, req: Request) {
  // Prune stale jobs so the map can't grow forever.
  jobs.forEach((v, k) => { if (Date.now() - v.at > 10 * 60 * 1000) jobs.delete(k); });
  jobs.set(id, { owner, status: "running", at: Date.now() });
  aiGameHTML(req, prompt, style, model)
    .then((ai) => {
      const j = jobs.get(id);
      if (!j) return;
      if (ai) jobs.set(id, { owner: j.owner, status: "done", html: ai.html, provider: ai.provider, at: Date.now() });
      else jobs.set(id, { owner: j.owner, status: "error", error: "AI generation failed. The free provider may be busy — wait a minute and try again.", at: Date.now() });
    })
    .catch((e) => {
      const j = jobs.get(id);
      jobs.set(id, { owner: j?.owner || owner, status: "error", error: String(e), at: Date.now() });
    });
}
export async function GET(req: Request){
  const t = cookies().get("session")?.value || "";
  const user = await verifyJwt(t);
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { rateLimit } = await import("@/lib/security");
  const rl = rateLimit("gamepoll:" + (user as any).sub, 60, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const { KILO_FREE_MODELS, KILO_DEFAULT_MODEL } = await import("@/lib/kilo");
  const { OPENCODE_FREE_MODELS, OPENCODE_DEFAULT_MODEL, opencodeAuthOk } = await import("@/lib/opencode");
  const id = new URL(req.url).searchParams.get("job");
  if (id) {
    const j = jobs.get(id);
    if (!j) return NextResponse.json({ error: "Unknown job" }, { status: 404 });
    if (j.owner !== (user as any).sub) return NextResponse.json({ error: "Not your job." }, { status: 403 });
    if (j.status === "running") return NextResponse.json({ ok: true, status: "running" });
    if (j.status === "error") return NextResponse.json({ ok: false, error: j.error }, { status: 503 });
    return NextResponse.json({ ok: true, status: "done", html: j.html, name: "index.html", size: (j.html || "").length, engine: "ai", provider: j.provider });
  }
  return NextResponse.json({ ok:true, service:"game-generate", ai: true, model: OPENCODE_DEFAULT_MODEL, source: "opencode+kilo", opencodeModels: OPENCODE_FREE_MODELS, opencodeDefault: OPENCODE_DEFAULT_MODEL, opencodeAuth: await opencodeAuthOk(), freeModels: KILO_FREE_MODELS, kiloModels: KILO_FREE_MODELS, kiloDefault: KILO_DEFAULT_MODEL });
}
