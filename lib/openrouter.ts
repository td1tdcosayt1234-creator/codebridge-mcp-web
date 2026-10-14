import crypto from "crypto";

// Roun Co Pilot — OpenRouter free models only. Shown in Game Studio as
// "Roun Co Pilot". Env: OPENROUTER_API_KEY (repo secret, also in .env).
export const ROUN_LABEL = "Roun Co Pilot";
export const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

// Public id (Game Studio dropdown) -> real OpenRouter model id.
export const ROUN_MODEL_MAP: Record<string, string> = {
  "roun/north-mini-code": "cohere/north-mini-code:free",
  "roun/laguna": "poolside/laguna-s-2.1:free",
  "roun/laguna-xs": "poolside/laguna-xs-2.1:free",
  "roun/nemotron-super": "nvidia/nemotron-3-super-120b-a12b:free",
  "roun/gemma-31b": "google/gemma-4-31b-it:free",
};
export const ROUN_MODELS = Object.keys(ROUN_MODEL_MAP);
export const ROUN_DEFAULT = ROUN_MODELS[0];
// Short display names for the dropdown.
export const ROUN_LABELS: Record<string, string> = {
  "roun/north-mini-code": "North Mini Code",
  "roun/laguna": "Laguna Coder",
  "roun/laguna-xs": "Laguna Fast",
  "roun/nemotron-super": "Nemotron Super",
  "roun/gemma-31b": "Gemma 31B",
};

export function orKey(): string {
  return (process.env.OPENROUTER_API_KEY || "").trim();
}
export function orKeyOk(k = orKey()): boolean {
  return k.replace(/^sk-or-v1-/, "").length > 20;
}
export function cleanRounModel(m: unknown): string {
  const s = String(m || "").slice(0, 120);
  if (!/^[A-Za-z0-9._:\/-]+$/.test(s)) return "";
  return ROUN_MODELS.includes(s) ? s : "";
}

function siteRef(): string {
  return (process.env.SITE_URL || "https://roun.sryze.cc").replace(/\/+$/, "");
}

export async function orChat(
  messages: { role: string; content: string }[],
  opts: { model: string; maxTokens: number; temperature?: number; timeoutMs?: number } = {
    model: ROUN_MODEL_MAP[ROUN_DEFAULT],
    maxTokens: 800,
  },
): Promise<string> {
  const key = orKey();
  if (!orKeyOk(key)) return "";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs || 90000);
  try {
    const r = await fetch(OPENROUTER_BASE + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key,
        "HTTP-Referer": siteRef(),
        "X-Title": ROUN_LABEL,
      },
      body: JSON.stringify({
        model: opts.model,
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens,
      }),
      signal: ctrl.signal,
    });
    if (!r.ok) {
      console.warn(`[roun-co-pilot] ${opts.model}: HTTP ${r.status}`);
      return "";
    }
    const j = await r.json().catch(() => ({}));
    // Some free reasoning models put text in reasoning fields — join all text.
    const msg = j?.choices?.[0]?.message || {};
    const parts: string[] = [];
    if (typeof msg.content === "string" && msg.content.trim()) parts.push(msg.content);
    if (typeof msg.reasoning === "string" && msg.reasoning.trim()) parts.push(msg.reasoning);
    if (Array.isArray(msg.reasoning_details)) {
      for (const d of msg.reasoning_details) {
        if (d && typeof d.text === "string" && d.text.trim()) parts.push(d.text);
      }
    }
    return parts.join("\n").trim();
  } catch (e) {
    console.warn(`[roun-co-pilot] ${opts.model}: ${String(e).slice(0, 200)}`);
    return "";
  } finally {
    clearTimeout(timer);
  }
}

function extractHTML(raw: string): string {
  let s = (raw || "").trim();
  if (!s) return "";
  const fence = s.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) s = fence[1].trim();
  return s;
}

function looksLikeGame(html: string): boolean {
  if (html.length < 800 || html.length > 200000) return false;
  const lower = html.toLowerCase();
  return lower.includes("<html") && (lower.includes("<canvas") || lower.includes("<script"));
}

// Rotation order: selected model first (strict — caller decides fallback),
// auto mode tries code specialists first.
export function rounRotation(preferred = ""): string[] {
  const all = [...ROUN_MODELS];
  const sel = cleanRounModel(preferred);
  if (sel) return [sel, ...all.filter((m) => m !== sel)];
  return all;
}

export async function rounGameHTML(
  prompt: string,
  styleLabel: string,
  system: string,
  preferred = "",
  singleTry = false,
): Promise<{ html: string; provider: string; model: string } | null> {
  const cleanPrompt = String(prompt || "").slice(0, 500);
  const tries = rounRotation(preferred);
  const list = singleTry ? tries.slice(0, 1) : tries;
  for (const id of list) {
    const real = ROUN_MODEL_MAP[id];
    const raw = await orChat(
      [
        { role: "system", content: system },
        {
          role: "user",
          content: `Game idea: ${cleanPrompt}\n\nOutput ONLY raw HTML — no markdown, no fences, no explanation.`,
        },
      ],
      { model: real, maxTokens: 16000, temperature: 0.8, timeoutMs: 190000 },
    );
    const html = extractHTML(raw);
    if (looksLikeGame(html)) return { html, provider: ROUN_LABEL, model: id };
    console.warn(`[roun-co-pilot] ${id}: bad output (${raw.length} chars)`);
  }
  return null;
}

export function newNonce(prefix: string): string {
  return prefix + "_" + crypto.randomBytes(16).toString("hex");
}
