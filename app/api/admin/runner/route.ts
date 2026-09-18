import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import { encToken } from "@/lib/crypto";
import crypto from "crypto";

async function admin() {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p || p.role !== "admin") return null;
  return p;
}

// Builder repo + workflow + runner token manage koro. Runner token sudhu regenerate er somoy ekbar dekha jabe.
export async function GET() {
  const p = await admin();
  if (!p) return NextResponse.json({ error: "admin only" }, { status: 403 });
  const db = await readDb();
  return NextResponse.json({
    builderRepo: db.settings?.builderRepo || "",
    builderWorkflow: db.settings?.builderWorkflow || "opencode-task.yml",
    tokenConfigured: !!db.settings?.runnerTokenEnc,
    updatedBy: db.settings?.updatedBy || "",
    updatedAt: db.settings?.updatedAt || "",
    counts: {
      queued: db.tasks.filter((x) => x.status === "queued").length,
      running: db.tasks.filter((x) => x.status === "running").length,
      done: db.tasks.filter((x) => x.status === "done").length,
      failed: db.tasks.filter((x) => x.status === "failed").length,
    },
    recent: db.tasks.slice(-20).reverse(),
  });
}

export async function POST(req: Request) {
  const p = await admin();
  if (!p) return NextResponse.json({ error: "admin only" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const db = await readDb();
  db.settings = db.settings || { builderRepo: "", builderWorkflow: "opencode-task.yml", runnerTokenEnc: "", updatedBy: "", updatedAt: "" };
  if (body.regenerate) {
    const token = "cb_run_" + crypto.randomBytes(24).toString("hex");
    db.settings.runnerTokenEnc = encToken(token);
    db.settings.updatedBy = p.email || p.sub;
    db.settings.updatedAt = new Date().toISOString();
    db.events.push({ id: uid("e"), userId: p.sub, action: "runner_token_regen", detail: "runner token regenerated", at: db.settings.updatedAt });
    await writeDb(db);
    return NextResponse.json({ ok: true, token, note: "Ekbar e dekhabe — ekhoni builder repo secret RUNNER_TOKEN e bosao." });
  }
  if (body.builderRepo !== undefined) {
    const r = String(body.builderRepo).trim();
    if (r && !r.includes("/")) return NextResponse.json({ error: "builderRepo owner/repo format e hote hobe" }, { status: 400 });
    db.settings.builderRepo = r;
  }
  if (body.builderWorkflow !== undefined) db.settings.builderWorkflow = String(body.builderWorkflow).trim() || "opencode-task.yml";
  db.settings.updatedBy = p.email || p.sub;
  db.settings.updatedAt = new Date().toISOString();
  db.events.push({ id: uid("e"), userId: p.sub, action: "runner_settings", detail: db.settings.builderRepo + " " + db.settings.builderWorkflow, at: db.settings.updatedAt });
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
