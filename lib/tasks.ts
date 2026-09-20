import { readDb, writeDb, uid, type DbShape } from "./db";
import { decToken } from "./crypto";
import { safeEqual } from "./security";
import { estimateTask, MAX_FILES_BYTES, filesBytes } from "./tokens";

// Users never touch repos. Flow: web request -> Actions OpenCode run -> output to web -> user.
export function runnerSettings(db: DbShape) {
  return {
    builderRepo: db.settings?.builderRepo || "",
    builderWorkflow: db.settings?.builderWorkflow || "opencode-task.yml",
  };
}

export function bearerToken(req: Request): string {
  const h = req.headers.get("authorization") || "";
  return h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : "";
}

// Wait for a task to finish (for MCP: submit + return live result). Resolves
// with the latest task state after done/failed or timeout.
export async function waitForResult(taskId: string, timeoutMs = 45000): Promise<DbShape["tasks"][number] | null> {
  const start = Date.now();
  let last: DbShape["tasks"][number] | null = null;
  while (Date.now() - start < timeoutMs) {
    const db = await readDb();
    const t = db.tasks.find((x) => x.id === taskId) || null;
    if (!t) return null;
    last = t;
    if (t.status === "done" || t.status === "failed") return t;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return last;
}

export function verifyRunner(db: DbShape, token: string): boolean {
  const enc = db.settings?.runnerTokenEnc;
  if (!enc || !token) return false;
  try {
    return safeEqual(decToken(enc), token);
  } catch {
    return false;
  }
}

export async function createTaskAndDispatch(
  userId: string,
  title: string,
  prompt: string,
  opts?: { kind?: "compile" | "fix-compile"; files?: { path: string; content: string }[] }
): Promise<{ task: DbShape["tasks"][number] } | { error: string; status: number }> {
  if (!title.trim() || !prompt.trim()) return { error: "Title and prompt are both required.", status: 400 };
  const kind = opts?.kind === "fix-compile" ? "fix-compile" : "compile";
  const files = (opts?.files || []).filter((f) => f.path && f.content !== undefined).slice(0, 20).map((f) => ({ path: String(f.path).slice(0, 200), content: String(f.content).slice(0, 100000) }));
  if (filesBytes(files) > MAX_FILES_BYTES) return { error: "Files too large (max 200KB). Split into smaller requests.", status: 400 };
  const db = await readDb();
  const { builderRepo, builderWorkflow } = runnerSettings(db);
  if (!builderRepo.includes("/"))
    return { error: "Admin has not set the builder repo yet. Ask them to set it in /admin/runner.", status: 400 };
  if (!db.globalGithub?.enc)
    return { error: "Admin has not set the global GitHub token yet.", status: 400 };
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
    status: "queued", log: "Queued (" + kind + ", ~" + est + " tokens held). Dispatching the OpenCode runner on GitHub Actions...", result: "", runUrl: "",
    tokensEst: est, tokensCharged: est, createdAt: now, updatedAt: now,
  };
  db.tasks.push(task);
  db.events.push({ id: uid("e"), userId, action: "task_create", detail: title.trim(), at: now });
  // Dispatch workflow -> Actions e opencode run korbe
  try {
    const { Octokit } = await import("octokit");
    const oct = new Octokit({ auth: decToken(db.globalGithub.enc) });
    const [owner, repo] = builderRepo.split("/");
    await oct.request("POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches", {
      owner, repo, workflow_id: builderWorkflow, ref: "main", inputs: { task_id: task.id },
    });
    task.log = "Dispatched to " + builderRepo + " (" + builderWorkflow + "). Runner opencode start korle status running hobe.";
    const us = db.usage.find((u) => u.userId === userId);
    if (us) { us.mcpCalls += 1; us.githubCalls += 1; }
    await writeDb(db);
    return { task };
  } catch (e) {
    task.status = "failed";
    task.log = "Dispatch failed: " + (e as Error).message + ". Ask admin to check the workflow file + repo secrets.";
    task.updatedAt = new Date().toISOString();
    // Dispatch hoy ni — hold kora coin refund, nahole infra fail eo charge katbe
    const usu = db.usage.find((u) => u.userId === userId);
    if (usu) { usu.balance += est; usu.usedTotal = Math.max(0, usu.usedTotal - est); }
    task.tokensCharged = 0;
    await writeDb(db);
    return { error: task.log, status: 502 };
  }
}
