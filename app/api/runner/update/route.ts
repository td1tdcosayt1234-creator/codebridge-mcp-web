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
  task.status = st as typeof task.status;
  if (log !== undefined) task.log = String(log).slice(0, 20000);
  if (result !== undefined) task.result = String(result).slice(0, 20000);
  if (run_url !== undefined) task.runUrl = String(run_url);
  task.updatedAt = new Date().toISOString();
  // Final charge: bigger output (incl. fixes) costs more — charge extra above the estimate
  if (st === "done" || st === "failed") {
    const actual = estimateResult(task.log, task.result);
    const extra = Math.max(0, actual - task.tokensCharged);
    if (extra > 0) {
      let us = db.usage.find((u) => u.userId === task.userId);
      if (!us) { us = { userId: task.userId, mcpCalls: 0, githubCalls: 0, balance: 10000, usedTotal: 0 }; db.usage.push(us); }
      us.balance -= extra;
      us.usedTotal += extra;
      task.tokensCharged += extra;
    }
  }
  task.updatedAt = new Date().toISOString();
  db.events.push({ id: uid("e"), userId: task.userId, action: "task_" + st, detail: task.id, at: task.updatedAt });
  await writeDb(db);
  return NextResponse.json({ ok: true, task });
}
