import { NextResponse } from "next/server";
import { readDb, writeDb, uid } from "@/lib/db";
import { bearerToken, verifyRunner } from "@/lib/tasks";

export const dynamic = "force-dynamic";

// A runner that dies after claiming (crash, cancelled workflow) would leave
// the task "running" forever with the user's coins held. Sweep anything
// claimed longer than this back to failed + refund on every poll.
const STUCK_MS = 45 * 60 * 1000;

// Actions runner: take the next job. ?task_id= takes that task, otherwise the oldest queued one.
export async function GET(req: Request) {
  const { rateLimit, clientIp, isBanned, banResponse, recordViolation } = await import("@/lib/security");
  const ip = clientIp(req);
  if (isBanned(ip)) return banResponse();
  const rl = rateLimit("runner:" + ip, 60, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Rate limited. Retry in " + rl.retryAfterSec + "s." }, { status: 429 });
  const db = await readDb();
  if (!verifyRunner(db, bearerToken(req))) {
    recordViolation(ip, 2);
    return NextResponse.json({ error: "bad runner token" }, { status: 403 });
  }
  const now = new Date().toISOString();
  let swept = false;
  for (const t of db.tasks) {
    if (t.status === "running" && Date.now() - new Date(t.updatedAt).getTime() > STUCK_MS) {
      t.status = "failed";
      t.log = (t.log || "") + "\nRunner went silent for 45+ min — auto-failed and hold refunded. Re-send the request or ask the admin to check the runner.";
      t.tokensCharged = 0;
      const us = db.usage.find((u) => u.userId === t.userId);
      if (us) { us.balance += t.tokensEst; us.usedTotal = Math.max(0, us.usedTotal - t.tokensEst); }
      t.updatedAt = now;
      db.events.push({ id: uid("e"), userId: t.userId, action: "task_stuck_refund", detail: t.id, at: now });
      swept = true;
    }
  }
  const url = new URL(req.url);
  const want = url.searchParams.get("task_id") || "";
  const task = want ? db.tasks.find((x) => x.id === want) : db.tasks.find((x) => x.status === "queued");
  if (!task) {
    if (swept) await writeDb(db);
    return NextResponse.json({ error: "No queued tasks." }, { status: 404 });
  }
  if (task.status === "done" || task.status === "failed")
    return NextResponse.json({ error: "Task already finished: " + task.status }, { status: 409 });
  if (task.status === "running") {
    // Same runner retrying (not a second runner): hand the job back without
    // wiping the progress log it may already have posted.
    // Ensure a per-task nonce exists so update/apk can prove the claim.
    if (!task.runnerNonce) {
      const crypto = await import("crypto");
      task.runnerNonce = crypto.randomBytes(24).toString("hex");
      task.updatedAt = new Date().toISOString();
    }
    if (swept) await writeDb(db);
    else { try { await writeDb(db); } catch {} }
    return NextResponse.json({ id: task.id, title: task.title, prompt: task.prompt, kind: task.kind, files: task.files, status: task.status, resumed: true, runner_token: task.runnerNonce });
  }
  task.status = "running";
  task.log = "Runner started OpenCode (" + task.kind + ")...";
  task.updatedAt = new Date().toISOString();
  {
    const crypto = await import("crypto");
    task.runnerNonce = crypto.randomBytes(24).toString("hex");
  }
  db.events.push({ id: uid("e"), userId: task.userId, action: "task_running", detail: task.id, at: task.updatedAt });
  await writeDb(db);
  return NextResponse.json({ id: task.id, title: task.title, prompt: task.prompt, kind: task.kind, files: task.files, status: task.status, runner_token: task.runnerNonce });
}
