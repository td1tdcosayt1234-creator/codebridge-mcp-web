import { readDb, writeDb, uid, type DbShape } from "./db";
import { decToken } from "./crypto";
import { safeEqual } from "./security";
import { estimateTask, MAX_FILES_BYTES, filesBytes } from "./tokens";

// Users never touch repos. Flow: web request -> Actions OpenCode run -> output to web -> user.
// All-type detector: files[] theke project type guess kore — runner YAML + UI hint er jonno.
export function detectProjectType(files: { path: string }[]): string {
  const p = files.map((f) => String(f.path).toLowerCase());
  const has = (...names: string[]) => p.some((x) => names.some((n) => x === n || x.endsWith("/" + n)));
  const anyExt = (...exts: string[]) => p.some((x) => exts.some((e) => x.endsWith(e)));
  const anyDir = (...dirs: string[]) => p.some((x) => dirs.some((d) => x.includes(d)));
  if (p.some((x) => x.endsWith("androidmanifest.xml")) || has("settings.gradle", "app/build.gradle")) return "android";
  if (has("plugin.yml", "paper-plugin.yml", "bukkit.yml", "spigot.yml", "fabric.mod.json", "quilt.mod.json") || p.some((x) => x.endsWith("mods.toml")) || has("pack.mcmeta")) return "minecraft";
  if (has("pubspec.yaml") || anyExt(".dart")) return "flutter";
  if (has("deno.json", "deno.jsonc", "deno.lock")) return "deno";
  if (has("bun.lockb", "bunfig.toml")) return "bun";
  if (has("package.json")) return "node";
  if (has("requirements.txt", "pyproject.toml", "setup.py", "setup.cfg") || anyExt(".py")) return "python";
  if (has("go.mod")) return "go";
  if (has("cargo.toml")) return "rust";
  if (has("pom.xml", "build.gradle", "build.gradle.kts") || anyExt(".java", ".kt", ".kts")) return "java";
  if (has("global.json") || anyExt(".cs") || p.some(x=>x.endsWith(".csproj")||x.endsWith(".sln"))) return "dotnet";
  if (has("composer.json") || anyExt(".php")) return "php";
  if (has("gemfile", "gemfile.lock") || anyExt(".rb")) return "ruby";
  if (has("cmakelists.txt", "makefile") || anyExt(".c", ".cc", ".cpp", ".h", ".hpp")) return "cpp";
  if (anyExt(".html", ".css", ".js", ".ts", ".tsx", ".jsx", ".vue", ".svelte")) return "web";
  if (anyDir("datapacks/", "data/")) return "minecraft-datapack";
  if (files.length === 0) return "prompt-only";
  return "generic";
}
// Default builder repo: the site's own repo — its .github/workflows/opencode-task.yml
// is the ready-made workflow. Admin panel e repo na set korleo dispatch kaj kore.
export const DEFAULT_BUILDER_REPO = "td1tdcosayt1234-creator/codebridge-mcp-web";

// Env fallbacks so the pipeline runs even when the admin never opens /admin/runner
// or /admin/github: BUILDER_REPO, GITHUB_TOKEN (ROUN_GITHUB_TOKEN), RUNNER_TOKEN.
export function envGithubToken(): string {
  return (process.env.ROUN_GITHUB_TOKEN || process.env.GITHUB_TOKEN || "").trim();
}

export function runnerSettings(db: DbShape) {
  const saved = db.settings?.builderRepo || "";
  return {
    builderRepo: saved || (process.env.BUILDER_REPO || "").trim() || DEFAULT_BUILDER_REPO,
    builderWorkflow: db.settings?.builderWorkflow || "opencode-task.yml",
  };
}

// Effective dispatch token: admin-panel (DB) token wins, .env fallback.
export function effectiveGithubToken(db: DbShape): string {
  if (db.globalGithub?.enc) {
    try {
      const t = decToken(db.globalGithub.enc);
      if (t) return t;
    } catch {
      /* fall through to env */
    }
  }
  return envGithubToken();
}

export function bearerToken(req: Request): string {
  const h = req.headers.get("authorization") || "";
  return h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : "";
}

// Wait for a task to finish (for MCP: submit + return live result IN THE AGENT).
// Resolves with the latest task state after done/failed or timeout.
// Android Gradle builds take minutes (Ollama pull + assembleDebug ~3-6 min),
// so the agent call blocks up to ~8 min to deliver the FULL output directly â
// dashboard e jete hoy na.
export async function waitForResult(taskId: string, timeoutMs = 480000): Promise<DbShape["tasks"][number] | null> {
  const start = Date.now();
  let last: DbShape["tasks"][number] | null = null;
  while (Date.now() - start < timeoutMs) {
    const db = await readDb();
    const t = db.tasks.find((x) => x.id === taskId) || null;
    if (!t) return null;
    last = t;
    if (t.status === "done" || t.status === "failed") return t;
    await new Promise((r) => setTimeout(r, 5000));
  }
  return last;
}

export function verifyRunner(db: DbShape, token: string): boolean {
  if (!token) return false;
  const enc = db.settings?.runnerTokenEnc;
  if (enc) {
    try {
      return safeEqual(decToken(enc), token);
    } catch {
      return false;
    }
  }
  // Admin token regenerate korbe na? .env RUNNER_TOKEN diye runner chalano jay.
  const envTk = (process.env.RUNNER_TOKEN || "").trim();
  return !!envTk && safeEqual(envTk, token);
}

export async function createTaskAndDispatch(
  userId: string,
  title: string,
  prompt: string,
  opts?: { kind?: "compile" | "fix-compile"; files?: { path: string; content: string }[] }
): Promise<{ task: DbShape["tasks"][number] } | { error: string; status: number }> {
  if (!title.trim() || !prompt.trim()) return { error: "Title and prompt are both required.", status: 400 };
  // Cap inputs BEFORE estimate/storage: giant prompts = memory/CPU DoS + huge holds.
  title = title.trim().slice(0, 200);
  prompt = prompt.trim().slice(0, 20000);
  const kind = opts?.kind === "fix-compile" ? "fix-compile" : "compile";
  // Junk filter: .git/.gradle/build/node_modules etc. khabe na â age .git/hooks quota kheye
  // asol source batil hoye hallucination hoto (task_pl1jeie: 20tar 17tai .git/hooks chilo).
  const JUNK = /(^|\/)\.git(\/|$)|(^|\/)\.gradle(\/|$)|(^|\/)build(\/|$)|(^|\/)node_modules(\/|$)|(^|\/)\.next(\/|$)|(^|\/)__pycache__(\/|$)|(^|\/)\.idea(\/|$)|(^|\/)\.vscode(\/|$)|(^|\/)\.cxx(\/|$)|(^|\/)captures(\/|$)|(^|\/)\.externalNativeBuild(\/|$)|(^|\/)dist(\/|$)|(^|\/)out(\/|$)|(^|\/)target(\/|$)|(^|\/)\.dart_tool(\/|$)|local\.properties$|\.iml$|\.hprof$|\.bin$|\.apk$|\.aab$|\.jar$|\.war$|\.ear$|\.zip$|\.tar\.gz$|\.tgz$|\.exe$|\.dll$|\.so$|\.class$|\.o$|\.obj$|\.pyc$|\.mcpack$|\.mcaddon$/i;
  const files = (opts?.files || [])
    .filter((f) => f.path && f.content !== undefined)
    .map((f) => {
      // Contain paths inside task-work/: strip leading slashes, resolve away
      // "." / ".." segments, cap length. "…/…/secret" can never escape.
      const clean = String(f.path)
        .replace(/\0/g, "")
        .replace(/^\/+/, "")
        .split(/[\\/]+/)
        .filter((seg) => seg && seg !== "." && seg !== "..")
        .join("/")
        .slice(0, 200);
      return { path: clean, content: String(f.content).replace(/\0/g, "").slice(0, 100000) };
    })
    .filter((f) => f.path && !JUNK.test(f.path))
    .slice(0, 50).map((f) => ({ path: f.path, content: f.content }));
  if (filesBytes(files) > MAX_FILES_BYTES) return { error: "Files too large (max 200KB). Split into smaller requests.", status: 400 };
  const db = await readDb();
  const { builderRepo, builderWorkflow } = runnerSettings(db);
  if (!builderRepo.includes("/"))
    return { error: "No builder repo — set it in .env (BUILDER_REPO) or /admin/runner.", status: 400 };
  const ghToken = effectiveGithubToken(db);
  if (!ghToken)
    return { error: "No GitHub token yet — ask the admin to save one in /admin/github or set GITHUB_TOKEN in .env.", status: 400 };
  // Token hold: bigger files cost more tokens
  const est = estimateTask(prompt, files);
  let us = db.usage.find((u) => u.userId === userId);
  if (!us) { us = { userId, mcpCalls: 0, githubCalls: 0, balance: 10000, usedTotal: 0 }; db.usage.push(us); }
  if (us.balance < est)
    return { error: "Insufficient tokens (need ~" + est + ", have " + us.balance + "). Send smaller files or earn more.", status: 402 };
  us.balance -= est;
  us.usedTotal += est;
  const now = new Date().toISOString();
  const finalPrompt = kind === "fix-compile"
    ? prompt.trim() + "\n\n[RULE] If build/compile fails, read the error, fix it with AI yourself and retry up to 3 times. Keep every attempt in the log."
    : prompt.trim();
  const task: DbShape["tasks"][number] = {
    id: uid("task"), userId, title: title.trim(), prompt: finalPrompt, kind, files,
    status: "queued", log: "Queued (" + kind + ", ~" + est + " tokens held). Dispatching the Roun cloud runner...", result: "", runUrl: "",
    tokensEst: est, tokensCharged: est, createdAt: now, updatedAt: now,
  };
  db.tasks.push(task);
  db.events.push({ id: uid("e"), userId, action: "task_create", detail: title.trim(), at: now });
  // Persist FIRST (hold + task record), then dispatch. If the process dies
  // between the two, the task exists as queued — never an orphan Actions run
  // with no DB record and no way to refund.
  await writeDb(db);
  // Dispatch workflow -> Actions e opencode run korbe
  try {
    const { Octokit } = await import("octokit");
    const oct = new Octokit({ auth: ghToken });
    const [owner, repo] = builderRepo.split("/");
    await oct.request("POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches", {
      owner, repo, workflow_id: builderWorkflow, ref: "main", inputs: { task_id: task.id },
    });
    const db2 = await readDb();
    const t2 = db2.tasks.find((x) => x.id === task.id);
    if (t2) t2.log = "Dispatched to " + builderRepo + " (" + builderWorkflow + "). Runner start korle status running hobe.";
    const us2 = db2.usage.find((u) => u.userId === userId);
    if (us2) { us2.mcpCalls += 1; us2.githubCalls += 1; }
    await writeDb(db2);
    const fresh = (await readDb()).tasks.find((x) => x.id === task.id) || task;
    return { task: fresh };
  } catch (e) {
    task.status = "failed";
    task.log = "Dispatch failed: " + (e as Error).message + ". Ask admin to check the workflow file + repo secrets.";
    task.updatedAt = new Date().toISOString();
    // Dispatch hoy ni â hold kora coin refund, nahole infra fail eo charge katbe
    const usu = db.usage.find((u) => u.userId === userId);
    if (usu) { usu.balance += est; usu.usedTotal = Math.max(0, usu.usedTotal - est); }
    task.tokensCharged = 0;
    await writeDb(db);
    return { error: task.log, status: 502 };
  }
}
