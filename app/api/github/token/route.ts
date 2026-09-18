import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { decToken } from "@/lib/crypto";

async function me() {
  const t = cookies().get("session")?.value || "";
  return await verifyJwt(t);
}

// User GitHub token add/see DISABLED — shudhu admin global token use hobe.
// User ekhane sudhu admin je token add korse tar status + repo dekhte parbe.
export async function GET() {
  const p = await me();
  if (!p) return NextResponse.json({ error: "auth" }, { status: 401 });
  const db = await readDb();
  const globalOn = !!db.globalGithub?.enc;
  let repos: string[] = [];
  if (globalOn) {
    try {
      const { Octokit } = await import("octokit");
      const oct = new Octokit({ auth: decToken(db.globalGithub!.enc) });
      const r = await oct.request("GET /user/repos", { per_page: 20, affiliation: "owner" });
      repos = (r.data as unknown[]).map((x) => (x as { full_name: string }).full_name);
      const us = db.usage.find((x) => x.userId === p.sub);
      if (us) {
        us.githubCalls += 1;
        const { writeDb } = await import("@/lib/db");
        await writeDb(db);
      }
    } catch {
      repos = [];
    }
  }
  return NextResponse.json({
    connected: globalOn,
    source: globalOn ? "global" : null,
    managedBy: "admin",
    updatedAt: db.globalGithub?.updatedAt || "",
    repos,
  });
}

export async function POST() {
  return NextResponse.json(
    { error: "Disabled. GitHub token shudhu admin /admin/github theke add korte parbe." },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Disabled. GitHub token shudhu admin manage korte parbe." },
    { status: 403 }
  );
}
