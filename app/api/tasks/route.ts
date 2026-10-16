import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { createTaskAndDispatch } from "@/lib/tasks";

export const dynamic = "force-dynamic";

async function me() {
  const t = cookies().get("session")?.value || "";
  return await verifyJwt(t);
}

// Send a request on the web -> OpenCode in Actions -> output back to web -> you. No repo touching.
export async function GET() {
  const p = await me();
  if (!p) return NextResponse.json({ error: "auth" }, { status: 401 });
  const db = await readDb();
  const mine = db.tasks.filter((x) => x.userId === p.sub).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 50);
  return NextResponse.json({ tasks: mine });
}

export async function POST(req: Request) {
  const p = await me();
  if (!p) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { csrfCheck, csrfBlock } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const { title, prompt, kind, files } = await req.json().catch(() => ({}));
  // NOTE: all blockers (rate/bot/adblock/VPN) disabled by owner.
  const out = await createTaskAndDispatch(p.sub, String(title || ""), String(prompt || ""), {
    kind: kind === "fix-compile" ? "fix-compile" : "compile",
    files: Array.isArray(files) ? files : [],
  });
  if ("error" in out) return NextResponse.json({ error: out.error }, { status: out.status });
  return NextResponse.json({ ok: true, task: out.task }, { status: 201 });
}
