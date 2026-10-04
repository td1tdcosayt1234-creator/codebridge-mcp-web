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
  const { csrfCheck, csrfBlock, rateLimit, clientIp } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const rl = rateLimit("runner_apk:" + clientIp(req), 30, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const db = await readDb();
  if (!verifyRunner(db, bearerToken(req))) return NextResponse.json({ error: "bad runner token" }, { status: 403 });
  const url = new URL(req.url);
  const id = url.searchParams.get("task_id") || "";
  const kind = url.searchParams.get("kind") || "apk";
  const task = db.tasks.find((x) => x.id === id);
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  // Per-task claim proof (see /next + /update): new claims require runner_token.
  if (task.runnerNonce) {
    const got = String(url.searchParams.get("runner_token") || req.headers.get("x-task-token") || "");
    if (!got || got !== task.runnerNonce)
      return NextResponse.json({ error: "bad task token (pass runner_token from /next)" }, { status: 403 });
  }
  // Reject giant bodies before streaming to disk (OOM/disk-fill guard).
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > MAX_APK) return NextResponse.json({ error: "File too large (max 100MB)." }, { status: 413 });
  // Stream to temp file with running counter — never buffer 100MB in RAM.
  // Missing/lying content-length (chunked) is still capped mid-stream.
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "task";
  const dir = path.join(process.cwd(), "data", "apks");
  await fs.mkdir(dir, { recursive: true });
  const tmpPath = path.join(dir, safe + ".tmp." + Date.now() + "." + Math.random().toString(36).slice(2));
  let bytes = 0;
  try {
    if (!req.body) return NextResponse.json({ error: "Empty body." }, { status: 400 });
    const reader = req.body.getReader();
    const fh = await fs.open(tmpPath, "w");
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.length;
        if (bytes > MAX_APK) {
          try { await fh.close(); } catch {}
          try { await fs.unlink(tmpPath); } catch {}
          return NextResponse.json({ error: "File too large (max 100MB)." }, { status: 413 });
        }
        await fh.write(value);
      }
    } finally {
      try { await fh.close(); } catch {}
      try { reader.releaseLock(); } catch {}
    }
  } catch {
    try { await fs.unlink(tmpPath); } catch {}
    return NextResponse.json({ error: "Upload failed." }, { status: 400 });
  }
  if (!bytes) { try { await fs.unlink(tmpPath); } catch {} return NextResponse.json({ error: "Empty body." }, { status: 400 }); }
  const buf = await fs.readFile(tmpPath);
  try { await fs.unlink(tmpPath); } catch {}
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
