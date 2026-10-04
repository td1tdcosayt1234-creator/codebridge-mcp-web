import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { readDb, writeDb, uid } from "@/lib/db";
import { encToken } from "@/lib/crypto";
import crypto from "crypto";

async function admin() {
  const t = cookies().get("session")?.value || "";
  const p = await verifyJwt(t);
  if (!p?.sub) return null;
  // Never trust stale JWT role: re-read from DB (demoted admin keeps JWT 24h).
  const { readDb } = await import("@/lib/db");
  const db = await readDb();
  const u = db.users.find((x) => x.id === p.sub);
  if (!u || u.role !== "admin") return null;
  return { ...p, email: u.email, role: "admin" as const };
}

// Manage builder repo + workflow + runner token. The runner token is shown only once at regenerate time.
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
  const { csrfCheck, csrfBlock, rateLimit, clientIp } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const rl = rateLimit("admin_runner:" + clientIp(req), 30, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  // Tier-2: runner token + builder repo control code execution — 2FA mandatory.
  const { stepupInput, requireStepUp } = await import("@/lib/stepup");
  const step = await requireStepUp(String((p as Record<string, unknown>).sub), stepupInput(req, body), { admin: true });
  if (!step.ok)
    return NextResponse.json(
      { error: (step as { needEnroll?: boolean }).needEnroll ? "Enable 2FA in /dashboard/settings first." : "Fresh 2FA code required (x-2fa-code)." },
      { status: 403 }
    );
  const db = await readDb();
  db.settings = db.settings || { builderRepo: "", builderWorkflow: "opencode-task.yml", runnerTokenEnc: "", updatedBy: "", updatedAt: "" };
  if (body.regenerate) {
    const token = "cb_run_" + crypto.randomBytes(24).toString("hex");
    db.settings.runnerTokenEnc = encToken(token);
    db.settings.updatedBy = p.email || p.sub;
    db.settings.updatedAt = new Date().toISOString();
    db.events.push({ id: uid("e"), userId: p.sub, action: "runner_token_regen", detail: "runner token regenerated", at: db.settings.updatedAt });
    await writeDb(db);
    return NextResponse.json({ ok: true, token, note: "Shown only once — put it into the builder repo secret RUNNER_TOKEN now." });
  }
  if (body.builderRepo !== undefined) {
    const r = String(body.builderRepo).trim().slice(0, 200);
    if (r && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(r))
      return NextResponse.json({ error: "builderRepo must be owner/repo." }, { status: 400 });
    db.settings.builderRepo = r;
  }
  if (body.builderWorkflow !== undefined) {
    const w = String(body.builderWorkflow).trim().slice(0, 100);
    if (w && !/^[A-Za-z0-9_.-]+\.ya?ml$/.test(w))
      return NextResponse.json({ error: "builderWorkflow must be a .yml file." }, { status: 400 });
    db.settings.builderWorkflow = w || "opencode-task.yml";
  }
  db.settings.updatedBy = p.email || p.sub;
  db.settings.updatedAt = new Date().toISOString();
  db.events.push({ id: uid("e"), userId: p.sub, action: "runner_settings", detail: db.settings.builderRepo + " " + db.settings.builderWorkflow, at: db.settings.updatedAt });
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
