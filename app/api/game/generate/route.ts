import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
export const dynamic = "force-dynamic";

// --- AI game generation: Roun Co Pilot (OpenRouter free models) only. ---
import { ROUN_MODELS, ROUN_DEFAULT, cleanRounModel } from "@/lib/openrouter";

function baseModels(defaultModel: string) {
  return Array.from(new Set([defaultModel, ...ROUN_MODELS]));
}

// Only allow known models — the key owner pays for anything outside free tier.
function cleanModel(m: unknown, defaultModel: string): string {
  const s = String(m || "").slice(0, 120);
  if (!/^[A-Za-z0-9._:\/-]+$/.test(s)) return "";
  if (ROUN_MODELS.includes(s) || s === defaultModel) return s;
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

async function aiGameHTML(req: Request, prompt: string, style: string, preferred = "", setStage?: (s: JobStage) => void): Promise<{ html: string; provider: string } | null> {
  const cleanPrompt = String(prompt || "").slice(0, 500);
  // Chat mode sends style:"auto" — no preset palettes, AI picks visuals to fit the idea.
  const styleLabel = !style || style === "auto" ? "AI-chosen to best match the game idea" : String(style).slice(0, 40);
  const system = GAME_SYSTEM(styleLabel);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 200000);
  // Client gave up (tab closed, navigated away)? Stop the upstream calls too.
  req.signal.addEventListener("abort", () => { try { ctrl.abort(); } catch {} });
  // Strict model routing: a user-selected model is tried FIRST and alone —
  // no silent fallback to another model. Auto ("") rotates all Roun models.
  try {
    const { rounGameHTML, ROUN_LABELS } = await import("@/lib/openrouter");
    const sel = cleanRounModel(preferred);
    setStage?.({ key: "prepare", en: "Preparing", bn: "idea sajano hocche" });
    const ai = sel
      ? await rounGameHTML(cleanPrompt, styleLabel, system, sel, true, (a) =>
          setStage?.({ key: "coding", en: "Coding", bn: "game code likhche", model: ROUN_LABELS[a.id] || a.id, attempt: a.index, of: a.total }),
        )
      : await rounGameHTML(cleanPrompt, styleLabel, system, "", false, (a) =>
          setStage?.({ key: "coding", en: "Coding", bn: "game code likhche", model: ROUN_LABELS[a.id] || a.id, attempt: a.index, of: a.total }),
        );
    if (ai) return { html: ai.html, provider: ai.provider };
    console.warn("[game] Roun Co Pilot failed (selected=" + (sel || "auto") + ") — returning 503");
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
      const cleaned = cleanModel(rawModel, ROUN_DEFAULT);
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

// AI-written completion summary for the chat thread (no more hardcoded text).
async function aiSummary(prompt: string, provider: string, html: string): Promise<string> {
  try {
    const { orChat, ROUN_MODEL_MAP, ROUN_DEFAULT, orKeyOk } = await import("@/lib/openrouter");
    if (!orKeyOk()) return "";
    const hasCanvas = html.toLowerCase().includes("<canvas");
    const sizeKb = Math.round(html.length / 1024);
    const text = await orChat(
      [
        {
          role: "system",
          content:
            "You are Game Studio assistant. A browser game was just generated and is already live in the preview. Write a short chat reply (max 4 lines) in the user's language (Bengali mix if they wrote Bengali, else English). Mention: 1) what game was built, 2) controls (keyboard + touch), 3) one line inviting refinement (e.g. 'aro ki change chao?'). No markdown fences, no code, plain chat text with 1-2 emojis max.",
        },
        {
          role: "user",
          content: `Game idea: ${String(prompt || "").slice(0, 400)}\nProvider: ${provider}\nHTML size: ${sizeKb}KB, canvas: ${hasCanvas}\nWrite the completion reply.`,
        },
      ],
      { model: ROUN_MODEL_MAP[ROUN_DEFAULT], maxTokens: 400, temperature: 0.7, timeoutMs: 60000 },
    );
    if (text.length < 10 || text.length > 2000) return "";
    return text;
  } catch {
    return "";
  }
}

// In-memory game-generation jobs. Lost on restart (acceptable: client shows error and user retries).
// stage = REAL pipeline position (prepare -> coding[model] -> finalize), polled by the client.
export type JobStage = { key: "prepare" | "coding" | "finalize"; en: string; bn: string; model?: string; attempt?: number; of?: number };
const jobs = new Map<string, { owner: string; status: "running" | "done" | "error"; html?: string; provider?: string; summary?: string; error?: string; at: number; stage?: JobStage }>();
function startJob(id: string, owner: string, prompt: string, style: string, model: string, req: Request) {
  // Prune stale jobs so the map can't grow forever.
  jobs.forEach((v, k) => { if (Date.now() - v.at > 10 * 60 * 1000) jobs.delete(k); });
  jobs.set(id, { owner, status: "running", at: Date.now(), stage: { key: "prepare", en: "Preparing", bn: "idea sajano hocche" } });
  const setStage = (s: JobStage) => { const j = jobs.get(id); if (j && j.status === "running") jobs.set(id, { ...j, stage: s }); };
  aiGameHTML(req, prompt, style, model, setStage)
    .then(async (ai) => {
      const j = jobs.get(id);
      if (!j) return;
      if (ai) {
        setStage({ key: "finalize", en: "Finalizing", bn: "final touch + summary" });
        const summary = await aiSummary(prompt, ai.provider, ai.html);
        jobs.set(id, { owner: j.owner, status: "done", html: ai.html, provider: ai.provider, summary, at: Date.now() });
      }
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
  const { ROUN_MODELS, ROUN_DEFAULT, ROUN_LABEL, ROUN_LABELS, orKeyOk } = await import("@/lib/openrouter");
  const id = new URL(req.url).searchParams.get("job");
  if (id) {
    const j = jobs.get(id);
    if (!j) return NextResponse.json({ error: "Unknown job" }, { status: 404 });
    if (j.owner !== (user as any).sub) return NextResponse.json({ error: "Not your job." }, { status: 403 });
    if (j.status === "running") return NextResponse.json({ ok: true, status: "running", stage: j.stage || { key: "prepare", en: "Preparing", bn: "idea sajano hocche" } });
    if (j.status === "error") return NextResponse.json({ ok: false, error: j.error }, { status: 503 });
    return NextResponse.json({ ok: true, status: "done", html: j.html, summary: j.summary || "", name: "index.html", size: (j.html || "").length, engine: "ai", provider: j.provider });
  }
  return NextResponse.json({ ok:true, service:"game-generate", ai: orKeyOk(), model: ROUN_DEFAULT, rounModels: ROUN_MODELS, rounDefault: ROUN_DEFAULT, rounLabel: ROUN_LABEL, rounLabels: ROUN_LABELS, source: "roun-co-pilot" });
}
