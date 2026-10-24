import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { envGithubToken, runnerSettings } from "@/lib/tasks";

// Read-only status for dashboard users: never exposes the token value.
export async function GET() {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p) return NextResponse.json({ error: "auth" }, { status: 401 });
  const db = await readDb();
  const rs = runnerSettings(db);
  const mine = db.builds.filter((b) => b.userId === p.sub);
  const us = db.usage.find((u) => u.userId === p.sub);
  return NextResponse.json({
    configured: !!db.globalGithub?.enc || !!envGithubToken(),
    builderRepo: rs.builderRepo,
    builderWorkflow: db.settings?.builderWorkflow || "opencode-task.yml",
    uses: { githubCalls: us?.githubCalls || 0, builds: mine.length, lastBuild: mine[0]?.at || "" },
  });
}
