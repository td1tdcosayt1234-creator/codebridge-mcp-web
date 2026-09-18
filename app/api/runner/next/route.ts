import { NextResponse } from "next/server";
import { readDb, writeDb, uid } from "@/lib/db";
import { bearerToken, verifyRunner } from "@/lib/tasks";

// Actions runner: take the next job. ?task_id= takes that task, otherwise the oldest queued one.
export async function GET(req: Request) {
  const db = await readDb();
  if (!verifyRunner(db, bearerToken(req))) return NextResponse.json({ error: "bad runner token" }, { status: 403 });
  const url = new URL(req.url);
  const want = url.searchParams.get("task_id") || "";
  let task = want ? db.tasks.find((x) => x.id === want) : db.tasks.find((x) => x.status === "queued");
  if (!task) return NextResponse.json({ error: "No queued tasks." }, { status: 404 });
  if (task.status === "done" || task.status === "failed")
    return NextResponse.json({ error: "Task already finished: " + task.status }, { status: 409 });
  task.status = "running";
  task.log = "Runner started OpenCode (" + task.kind + ")...";
  task.updatedAt = new Date().toISOString();
  db.events.push({ id: uid("e"), userId: task.userId, action: "task_running", detail: task.id, at: task.updatedAt });
  await writeDb(db);
  return NextResponse.json({ id: task.id, title: task.title, prompt: task.prompt, kind: task.kind, files: task.files, status: task.status });
}
