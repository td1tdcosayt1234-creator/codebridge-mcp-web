import { execFile } from "child_process";
import os from "os";
import path from "path";
import fs from "fs/promises";

export const OPENCODE_DEFAULT_MODEL =
  process.env.OPENCODE_MODEL || "opencode/big-pickle";

// Free OpenCode Zen models (no per-token charge after `opencode auth login`).
// Env override must stay in this list.
export const OPENCODE_FREE_MODELS = [
  "opencode/big-pickle",
  "opencode/ling-3.0-flash-fin-free",
  "opencode/mimo-v2.5-free",
  "opencode/mimo-v2.6-flash-free",
  "opencode/muse-spark-1.2-contributor-free",
  "opencode/muse-spark-1.3-contributor-free",
  "opencode/nemotron-3-ultra-free",
  "opencode/nemotron-3.5-lightning-free",
  "opencode/jev-1.13-free",
  "opencode/space-bunny-free",
];

export function cleanOpencodeModel(m: unknown): string {
  const s = String(m || "").slice(0, 120);
  if (!/^[A-Za-z0-9._:\/-]+$/.test(s)) return "";
  if (OPENCODE_FREE_MODELS.includes(s)) return s;
  if (s === OPENCODE_DEFAULT_MODEL) return s;
  return "";
}

// Serialize opencode runs — the CLI keeps session state under one data dir.
let ocQueue: Promise<unknown> = Promise.resolve();
function withOcLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = ocQueue.then(fn, fn);
  ocQueue = run.catch(() => {});
  return run;
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

// Persistent isolated home for the server-side opencode CLI.
// Isolated via XDG_DATA_HOME so it never touches the user's own opencode state.
// Login once (same env):  XDG_DATA_HOME=<repo>/data/opencode-home opencode auth login
export function opencodeHome(): string {
  return (
    process.env.OPENCODE_HOME ||
    path.join(process.cwd(), "data", "opencode-home")
  );
}

async function findOpencodeBin(): Promise<string> {
  const candidates = [
    process.env.OPENCODE_BIN || "",
    "C:\\npm\\prefix\\node_modules\\opencode-ai\\bin\\opencode.exe",
    path.join(os.homedir(), ".opencode", "bin", "opencode"),
    path.join(os.homedir(), ".opencode", "bin", "opencode.exe"),
    "/usr/local/bin/opencode",
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      await fs.access(c);
      return c;
    } catch {
      /* try next */
    }
  }
  return "";
}

export async function opencodeAuthOk(): Promise<boolean> {
  try {
    const raw = await fs.readFile(
      path.join(opencodeHome(), "opencode", "auth.json"),
      "utf8",
    );
    return raw.trim().length > 10;
  } catch {
    return false;
  }
}

// Game Studio provider: local opencode CLI (free Zen models after one login).
// Returns null when CLI missing / not logged in / bad output — caller falls through.
async function opencodeGameHTMLInner(
  prompt: string,
  styleLabel: string,
  system: string,
  model = "",
  timeoutMs = 120000,
): Promise<{ html: string; provider: string } | null> {
  const want = cleanOpencodeModel(model) || OPENCODE_DEFAULT_MODEL;
  const bin = await findOpencodeBin();
  if (!bin) {
    console.warn("[game] opencode CLI not installed (npm i -g opencode-ai)");
    return null;
  }
  if (!(await opencodeAuthOk())) {
    console.warn("[game] opencode not logged in — run: opencode auth login (with OPENCODE_HOME set)");
    return null;
  }
  const workdir = await fs.mkdtemp(path.join(os.tmpdir(), "oc-game-"));
  const instruction =
    `${system}\n\nGame idea: ${String(prompt || "").slice(0, 500)}\n\n` +
    `Output ONLY raw HTML — no markdown, no fences, no explanation.`;
  const message =
    `Do NOT use any tools. Do NOT write any files. Answer ONLY with raw HTML in your chat response.\n\n${instruction}`;
  const args = ["run", "--format", "json", "-m", want, message];
  const GAME_TIMEOUT = Number(process.env.OPENCODE_TIMEOUT_MS || timeoutMs || 120000);
  try {
    const out = await new Promise<string>((resolve, reject) => {
      const child = execFile(
        bin,
        args,
        {
          cwd: workdir,
          timeout: GAME_TIMEOUT,
          maxBuffer: 16 * 1024 * 1024,
          windowsHide: true,
          env: { ...process.env, XDG_DATA_HOME: opencodeHome() },
        },
        (err, stdout, stderr) => {
          const combined = String(stdout || "") + "\n" + String(stderr || "");
          if (/not authenticated|not logged in|auth login|no auth|unauthorized|401/i.test(combined)) {
            reject(new Error("opencode-not-authed"));
            return;
          }
          if (err && combined.trim().length < 200) {
            reject(err);
            return;
          }
          resolve(combined);
        },
      );
      void child;
    });
    // --format json emits one JSON event per line. Text arrives in
    // message.part.updated events (part.text = full text so far).
    let text = "";
    for (const line of out.split("\n")) {
      const t = line.trim();
      if (!t.startsWith("{")) continue;
      try {
        const j = JSON.parse(t);
        const part = j?.properties?.part ?? j?.part;
        if (part?.type === "text" && typeof part.text === "string" && part.text.length > text.length) {
          text = part.text;
        }
        const chunk: unknown = j?.part?.text ?? j?.text ?? "";
        if (typeof chunk === "string" && chunk.length > text.length) text = chunk;
      } catch {
        /* non-JSON log line */
      }
    }
    const html = extractHTML(text) || extractHTML(out);
    if (looksLikeGame(html)) return { html, provider: "opencode:" + want };
    console.warn(`[game] opencode ${want}: bad output (${out.length} chars): ` + out.slice(0, 400).replace(/\s+/g, " "));
    return null;
  } catch (e) {
    console.warn(`[game] opencode ${want}: ${String(e).slice(0, 300)}`);
    return null;
  } finally {
    try {
      await fs.rm(workdir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}

export async function opencodeGameHTML(
  prompt: string,
  styleLabel: string,
  system: string,
  model = "",
  timeoutMs = 120000,
): Promise<{ html: string; provider: string } | null> {
  return withOcLock(() => opencodeGameHTMLInner(prompt, styleLabel, system, model, timeoutMs));
}
