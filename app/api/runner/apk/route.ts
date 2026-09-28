import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { readDb, writeDb, uid } from "@/lib/db";
import { bearerToken, verifyRunner } from "@/lib/tasks";

export const dynamic = "force-dynamic";
const MAX_APK = 100 * 1024 * 1024; // 100MB debug APK cap

// Actions runner: GitHub -> web. Runner uploads a built binary:
// - APK: ?task_id=... (assembleDebug success hole), saved as .apk
// - JAR/EXE/DEB: ?task_id=...&kind=jar|exe|deb&name=xyz (Maven/Gradle/Go/C++
//   success hole). Web stores it on disk, coding agent fetches it via
//   /api/tasks/[id]/apk|jar|exe|deb (link in MCP tool output).
export async function POST(req: Request) {
  const { csrfCheck, csrfBlock } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const db = await readDb();
  if (!verifyRunner(db, bearerToken(req))) return NextResponse.json({ error: "bad runner token" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("task_id") || "";
  const kind = new URL(req.url).searchParams.get("kind") || "apk";
  const task = db.tasks.find((x) => x.id === id);
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  // Reject giant bodies before buffering them into memory (OOM guard).
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > MAX_APK) return NextResponse.json({ error: "File too large (max 100MB)." }, { status: 413 });
  const buf = Buffer.from(await req.arrayBuffer());
  if (!buf.length) return NextResponse.json({ error: "Empty body." }, { status: 400 });
  if (buf.length > MAX_APK) return NextResponse.json({ error: "File too large (max 100MB)." }, { status: 413 });
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "task";
  const dir = path.join(process.cwd(), "data", "apks");
  await fs.mkdir(dir, { recursive: true });
  if (kind === "jar" || kind === "exe" || kind === "deb") {
    const ext = "." + kind;
    const fallback = kind === "jar" ? "plugin.jar" : kind === "exe" ? "app.exe" : "app.deb";
    const fileName = (new URL(req.url).searchParams.get("name") || fallback).replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 80) || fallback;
    await fs.writeFile(path.join(dir, safe + ext), buf);
    (task as Record<string, unknown>)[kind + "Size"] = buf.length;
    (task as Record<string, unknown>)[kind + "Name"] = fileName;
    task.artifacts = [...(task.artifacts || []).filter((a) => a.name !== fileName), { name: fileName, size: buf.length }];
    task.updatedAt = new Date().toISOString();
    db.events.push({ id: uid("e"), userId: task.userId, action: "task_" + kind, detail: id + " " + fileName + " " + buf.length + " bytes", at: task.updatedAt });
    await writeDb(db);
    return NextResponse.json({ ok: true, task_id: id, bytes: buf.length, file: fileName });
  }
  await fs.writeFile(path.join(dir, safe + ".apk"), buf);
  task.apkSize = buf.length;
  task.updatedAt = new Date().toISOString();
  db.events.push({ id: uid("e"), userId: task.userId, action: "task_apk", detail: id + " " + buf.length + " bytes", at: task.updatedAt });
  await writeDb(db);
  return NextResponse.json({ ok: true, task_id: id, bytes: buf.length });
}
