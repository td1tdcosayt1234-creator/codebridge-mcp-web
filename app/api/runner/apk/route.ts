import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { readDb, writeDb, uid } from "@/lib/db";
import { bearerToken, verifyRunner } from "@/lib/tasks";

export const dynamic = "force-dynamic";
const MAX_APK = 100 * 1024 * 1024; // 100MB debug APK cap

// Actions runner: GitHub -> web. Runner uploads the built debug APK binary
// (assembleDebug success hole). Web stores it on disk, coding agent fetches
// it via /api/tasks/[id]/apk (link returned in MCP tool output).
export async function POST(req: Request) {
  const { csrfCheck, csrfBlock } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const db = await readDb();
  if (!verifyRunner(db, bearerToken(req))) return NextResponse.json({ error: "bad runner token" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("task_id") || "";
  const task = db.tasks.find((x) => x.id === id);
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  const buf = Buffer.from(await req.arrayBuffer());
  if (!buf.length) return NextResponse.json({ error: "Empty body." }, { status: 400 });
  if (buf.length > MAX_APK) return NextResponse.json({ error: "APK too large (max 100MB)." }, { status: 413 });
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "task";
  const dir = path.join(process.cwd(), "data", "apks");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, safe + ".apk"), buf);
  task.apkSize = buf.length;
  task.updatedAt = new Date().toISOString();
  db.events.push({ id: uid("e"), userId: task.userId, action: "task_apk", detail: id + " " + buf.length + " bytes", at: task.updatedAt });
  await writeDb(db);
  return NextResponse.json({ ok: true, task_id: id, bytes: buf.length });
}
