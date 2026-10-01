import { execFile } from "child_process";
import os from "os";
import path from "path";
import fs from "fs/promises";

export const KILO_DEFAULT_MODEL =
  process.env.KILO_MODEL || "kilo/kilo-auto/free";

// Free Kilo Gateway models (no per-token charge). Env override must stay in this list.
export const KILO_FREE_MODELS = [
  "kilo/kilo-auto/free",
  "kilo/cohere/north-mini-code:free",
  "kilo/dots-studio/dots-3-note-preview:free",
  "kilo/inclusionai/ling-3.0-flash-sante:free",
  "kilo/liquid/lfm-2.5-2.6b:free",
  "kilo/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "kilo/nvidia/nemotron-3-super-120b-a12b:free",
  "kilo/nvidia/nemotron-3-ultra-550b-a55b:free",
  "kilo/nvidia/nemotron-3.5-lightning:free",
  "kilo/poolside/laguna-s-2.1:free",
  "kilo/poolside/laguna-xs-2.1:free",
  "kilo/qwen/qwen3.8-27b:free",
  "kilo/stepfun/step-3.7-flash:free",
  "kilo/thinkingmachines/inkling-small:free",
];

export function cleanKiloModel(m: unknown): string {
  const s = String(m || "").slice(0, 120);
  if (!/^[A-Za-z0-9._:\/-]+$/.test(s)) return "";
  if (KILO_FREE_MODELS.includes(s)) return s;
  if (s === KILO_DEFAULT_MODEL) return s;
  return "";
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

// Game Studio provider: local Kilo Code CLI (free Gateway models).
// Needs one-time `kilo auth login` on the server. Returns null when
// CLI missing / not authenticated / bad output — caller falls through.
export async function kiloGameHTML(
  prompt: string,
  styleLabel: string,
  system: string,
  model = "",
  timeoutMs = 120000,
): Promise<{ html: string; provider: string } | null> {
  const cleanPrompt = String(prompt || "").slice(0, 500);
  const want = cleanKiloModel(model) || KILO_DEFAULT_MODEL;
  const workdir = await fs.mkdtemp(path.join(os.tmpdir(), "kilo-game-"));
  const message =
    `${system}\n\nGame idea: ${cleanPrompt}\n\n` +
    `Output ONLY raw HTML — no markdown, no fences, no explanation.`;
  try {
    const out = await new Promise<string>((resolve, reject) => {
      const child = execFile(
        "kilo",
        ["run", "--auto", "-m", want, message],
        { cwd: workdir, timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024, windowsHide: true },
        (err, stdout, stderr) => {
          const combined = String(stdout || "") + "\n" + String(stderr || "");
          if (/not authenticated|no.*credential|auth login/i.test(combined)) {
            reject(new Error("kilo-not-authed"));
            return;
          }
          if (err) {
            reject(err);
            return;
          }
          resolve(combined);
        },
      );
      void child;
    });
    const html = extractHTML(out);
    if (looksLikeGame(html)) return { html, provider: "kilo:" + want };
    console.warn(`[game] kilo ${want}: bad output (${out.length} chars)`);
    return null;
  } catch (e) {
    console.warn(`[game] kilo ${want}: ${String(e).slice(0, 140)}`);
    return null;
  } finally {
    try {
      await fs.rm(workdir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}
