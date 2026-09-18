import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { createTaskAndDispatch } from "@/lib/tasks";

async function me() {
  const t = cookies().get("session")?.value || "";
  return await verifyJwt(t);
}

// Web e request dao -> Actions e opencode -> output web -> tumi. Repo touch kora lage na.
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
  const { title, prompt, kind, files } = await req.json().catch(() => ({}));
  const out = await createTaskAndDispatch(p.sub, String(title || ""), String(prompt || ""), {
    kind: kind === "fix-compile" ? "fix-compile" : "compile",
    files: Array.isArray(files) ? files : [],
  });
  if ("error" in out) return NextResponse.json({ error: out.error }, { status: out.status });
  return NextResponse.json({ ok: true, task: out.task }, { status: 201 });
}
