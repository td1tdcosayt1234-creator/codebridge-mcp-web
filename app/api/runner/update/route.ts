import { NextResponse } from "next/server";
import { readDb, writeDb, uid } from "@/lib/db";
import { bearerToken, verifyRunner } from "@/lib/tasks";
import { estimateResult } from "@/lib/tokens";

// Actions runner: send OpenCode output back to the web.
export async function POST(req: Request) {
  const { csrfCheck, csrfBlock } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const db = await readDb();
  if (!verifyRunner(db, bearerToken(req))) return NextResponse.json({ error: "bad runner token" }, { status: 403 });
  const { id, status, log, result, run_url } = await req.json().catch(() => ({}));
  const task = db.tasks.find((x) => x.id === String(id || ""));
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  const st = String(status || "");
  if (!["running", "done", "failed"].includes(st)) return NextResponse.json({ error: "Status must be running|done|failed." }, { status: 400 });
  // Terminal states are final: a finished task can never go back to running
  // (prevents status flapping and double-charge with a leaked runner token).
  if ((task.status === "done" || task.status === "failed") && st === "running")
    return NextResponse.json({ error: "Task already finished: " + task.status }, { status: 409 });
  task.status = st as typeof task.status;
  if (log !== undefined) task.log = String(log).slice(0, 20000);
  if (result !== undefined) task.result = String(result).slice(0, 20000);
  if (run_url !== undefined) task.runUrl = String(run_url);
  task.updatedAt = new Date().toISOString();
  // Final charge: bigger output (incl. fixes) costs more — charge extra above the estimate.
  // Cap: infra log bloat (gradle stacktrace) jeno choto test ke na mare —
  // total kokhonoi estimate-er 3x + 500 er beshi na (19-coin hello test e 7500 katsilo).
  if (st === "done" || st === "failed") {
    const actual = estimateResult(task.log, task.result);
    const maxTotal = task.tokensEst * 3 + 500;
    const extra = Math.max(0, Math.min(actual, maxTotal) - task.tokensCharged);
    if (extra > 0) {
      let us = db.usage.find((u) => u.userId === task.userId);
      if (!us) { us = { userId: task.userId, mcpCalls: 0, githubCalls: 0, balance: 10000, usedTotal: 0 }; db.usage.push(us); }
      // Floor at zero: the task already ran, so usage is still recorded in full.
      us.balance = Math.max(0, us.balance - extra);
      us.usedTotal += extra;
      task.tokensCharged += extra;
    }
  }
  db.events.push({ id: uid("e"), userId: task.userId, action: "task_" + st, detail: task.id, at: task.updatedAt });
  await writeDb(db);
  return NextResponse.json({ ok: true, task });
}
