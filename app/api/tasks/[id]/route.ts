import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p) return NextResponse.json({ error: "auth" }, { status: 401 });
  const db = await readDb();
  const task = db.tasks.find((x) => x.id === params.id);
  if (!task) return NextResponse.json({ error: "task painai" }, { status: 404 });
  if (task.userId !== p.sub && p.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ task });
}
