import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { rateLimit } = await import("@/lib/security");
  const rl = rateLimit("task_get:" + p.sub, 60, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const db = await readDb();
  const task = db.tasks.find((x) => x.id === params.id);
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  const role = db.users.find((u) => u.id === p.sub)?.role || "";
  if (task.userId !== p.sub && role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ task });
}
