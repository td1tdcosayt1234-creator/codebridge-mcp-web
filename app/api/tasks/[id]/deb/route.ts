import { promises as fs } from "fs";
import path from "path";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// Web -> coding agent (and dashboard): download the DEB the runner uploaded
// (Maven/Gradle/Minecraft plugin build).
// Auth: login session cookie OR personal MCP key (same Bearer key as /api/mcp).
// Owner or admin only.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { safeEqual } = await import("@/lib/security");
  const db = await readDb();
  // Authenticate FIRST so strangers cannot probe which task ids have DEBs.
  const h = req.headers.get("authorization") || "";
  const key = h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : "";
  let userId = "";
  let role = "";
  if (key) {
    const hit = db.mcpKeys.find((k) => k.key.length === key.length && safeEqual(k.key, key));
    if (!hit) return Response.json({ error: "Invalid key." }, { status: 401 });
    userId = hit.userId;
    role = db.users.find((u) => u.id === userId)?.role || "";
  } else {
    const cookies = req.headers.get("cookie") || "";
    const m = cookies.split(";").map((s) => s.trim()).find((s) => s.startsWith("session="));
    if (!m) return Response.json({ error: "Login required." }, { status: 401 });
    const { verifyJwt } = await import("@/lib/auth");
    const p = await verifyJwt(decodeURIComponent(m.slice(8)));
    if (!p?.sub) return Response.json({ error: "Login required." }, { status: 401 });
    userId = String(p.sub);
    role = db.users.find((u) => u.id === userId)?.role || ""; // Never trust stale JWT role.
  }
  const task = db.tasks.find((x) => x.id === params.id);
  if (!task || !task.debSize) return Response.json({ error: "No DEB for this task." }, { status: 404 });
  if (userId !== task.userId && role !== "admin")
    return Response.json({ error: "Not your task." }, { status: 403 });
  const safe = task.id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "task";
  const name = (task.debName || "app.deb").replace(/[^a-zA-Z0-9_.-]/g, "") || "app.deb";
  let buf: Buffer;
  try {
    buf = await fs.readFile(path.join(process.cwd(), "data", "apks", safe + ".deb"));
  } catch {
    return Response.json({ error: "DEB file missing on server." }, { status: 410 });
  }
  const body = new Uint8Array(buf);
  return new Response(body, {
    headers: {
      "Content-Type": "application/vnd.debian.binary-package",
      "Content-Length": String(body.length),
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}

