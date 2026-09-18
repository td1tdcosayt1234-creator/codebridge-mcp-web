import { NextResponse } from "next/server";
import { readDb, writeDb, uid } from "@/lib/db";
import { bearerToken, verifyRunner } from "@/lib/tasks";

// Actions runner: porer kaj nao. ?task_id= dile oi task, naile oldest queued.
export async function GET(req: Request) {
  const db = await readDb();
  if (!verifyRunner(db, bearerToken(req))) return NextResponse.json({ error: "bad runner token" }, { status: 403 });
  const url = new URL(req.url);
  const want = url.searchParams.get("task_id") || "";
  let task = want ? db.tasks.find((x) => x.id === want) : db.tasks.find((x) => x.status === "queued");
  if (!task) return NextResponse.json({ error: "kono queued task nai" }, { status: 404 });
  if (task.status === "done" || task.status === "failed")
    return NextResponse.json({ error: "task already finished: " + task.status }, { status: 409 });
  task.status = "running";
  task.log = "Runner opencode start korse (" + task.kind + ")...";
  task.updatedAt = new Date().toISOString();
  db.events.push({ id: uid("e"), userId: task.userId, action: "task_running", detail: task.id, at: task.updatedAt });
  await writeDb(db);
  return NextResponse.json({ id: task.id, title: task.title, prompt: task.prompt, kind: task.kind, files: task.files, status: task.status });
}
