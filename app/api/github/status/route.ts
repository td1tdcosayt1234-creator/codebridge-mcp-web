import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb } from "@/lib/db";

// Read-only status for dashboard users: never exposes the token value.
export async function GET() {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p) return NextResponse.json({ error: "auth" }, { status: 401 });
  const db = await readDb();
  return NextResponse.json({
    configured: !!db.globalGithub?.enc,
    builderRepo: db.settings?.builderRepo || "",
    builderWorkflow: db.settings?.builderWorkflow || "opencode-task.yml",
  });
}
