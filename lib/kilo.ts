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
// Keyless free models work without `kilo auth login`; login unlocks more.
// Returns null when CLI missing / bad output — caller falls through.
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
  const instruction =
    `${system}\n\nGame idea: ${cleanPrompt}\n\n` +
    `Output ONLY raw HTML — no markdown, no fences, no explanation.`;
  // Prompt goes inline as the run message (direct node invocation handles
  // spaces/newlines fine — no shell quoting involved).
  // --agent ask answers from knowledge without touching files: the default
  // code agent instead tries `write snake.html` (absolute path outside the
  // temp workspace), fails validation 3x and aborts the turn with no output.
  const message =
    `Do NOT use any tools. Do NOT write any files. Answer ONLY with raw HTML in your chat response.\n\n${instruction}`;
  // Run Kilo's JS entry directly with node — the global `kilo` shim is a
  // .ps1/.cmd wrapper that plain execFile cannot launch (ENOENT) and
  // `cmd /c` mangles multi-word args. Direct node invocation needs no shell.
  const candidates = [
    process.env.KILO_BIN || "",
    "C:\\npm\\prefix\\node_modules\\@kilocode\\cli\\bin\\kilo",
    "/usr/local/lib/node_modules/@kilocode/cli/bin/kilo",
    "/usr/lib/node_modules/@kilocode/cli/bin/kilo",
  ].filter(Boolean);
  let kiloBin = "";
  for (const c of candidates) {
    try {
      await fs.access(c);
      kiloBin = c;
      break;
    } catch {
      /* try next */
    }
  }
  if (!kiloBin) {
    console.warn("[game] kilo CLI not installed (npm i -g @kilocode/cli)");
    return null;
  }
  const file = process.execPath;
  const args = [kiloBin, "run", "--auto", "--agent", "ask", "-m", want, "--format", "json", message];
  const GAME_TIMEOUT = Number(process.env.KILO_TIMEOUT_MS || timeoutMs || 180000);
  try {
    const out = await new Promise<string>((resolve, reject) => {
      const child = execFile(
        file,
        args,
        { cwd: workdir, timeout: GAME_TIMEOUT, maxBuffer: 16 * 1024 * 1024, windowsHide: true },
        (err, stdout, stderr) => {
          const combined = String(stdout || "") + "\n" + String(stderr || "");
          if (/not authenticated|no.*credential|auth login/i.test(combined)) {
            reject(new Error("kilo-not-authed"));
            return;
          }
          // Kilo may exit non-zero (e.g. a denied tool call) AFTER printing
          // a usable game. Don't discard output — let the parser decide.
          if (err && combined.trim().length < 200) {
            reject(err);
            return;
          }
          resolve(combined);
        },
      );
      void child;
    });
    // --format json emits one JSON event per line. Game HTML can live in:
    //  1) {"type":"text","part":{"text":"...```html..."}} events (final answer)
    //  2) {"type":"tool_use",...,"tool":"write","state":{...,"input":{"content":"<!DOCTYPE..."}}} events
    let text = "";
    let toolHtml = "";
    for (const line of out.split("\n")) {
      const t = line.trim();
      if (!t.startsWith("{")) continue;
      try {
        const j = JSON.parse(t);
        const chunk: unknown = j?.part?.text ?? j?.text ?? "";
        if (typeof chunk === "string" && chunk) text += chunk + "\n";
        const input = j?.part?.state?.input ?? j?.state?.input;
        const content: unknown = input?.content;
        if (
          typeof content === "string" &&
          content.length > 800 &&
          content.toLowerCase().includes("<html")
        ) {
          toolHtml = content;
        }
      } catch {
        /* non-JSON log line */
      }
    }
    const html = extractHTML(text) || extractHTML(toolHtml) || extractHTML(out);
    if (looksLikeGame(html)) return { html, provider: "kilo:" + want };
    console.warn(`[game] kilo ${want}: bad output (${out.length} chars)`);
    return null;
  } catch (e) {
    console.warn(`[game] kilo ${want}: ${String(e).slice(0, 300)}`);
    return null;
  } finally {
    try {
      await fs.rm(workdir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}
