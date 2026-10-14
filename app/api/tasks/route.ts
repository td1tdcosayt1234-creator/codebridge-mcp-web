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
  const { rateLimit } = await import("@/lib/security");
  const rl = rateLimit("tasks_get:" + p.sub, 60, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const db = await readDb();
  const mine = db.tasks.filter((x) => x.userId === p.sub).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 50);
  return NextResponse.json({ tasks: mine });
}

export async function POST(req: Request) {
  const p = await me();
  if (!p) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { rateLimit, csrfCheck, csrfBlock } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const rl = rateLimit("task:" + p.sub, 10, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Wait " + rl.retryAfterSec + "s." }, { status: 429 });
  const { title, prompt, kind, files, website, adblock } = await req.json().catch(() => ({}));
  const { honeypot, isVpn } = await import("@/lib/antifraud");
  if (honeypot({ website })) return NextResponse.json({ error: "Bot detected." }, { status: 400 });
  // Strict: adblock on = no new requests (honest browsers; missing flag = old
  // cache or agent API path, fail-open). Earn gate is in /api/earn.
  if (adblock === true) {
    const { recordViolation, clientIp } = await import("@/lib/security");
    recordViolation(clientIp(req), 2);
    return NextResponse.json({ error: "Adblock detected. Turn it off to send requests." }, { status: 403 });
  }
  // VPN/proxy exit = no new requests (coin-spend abuse vector).
  // Agent API path (bearer) skips this: agents run from datacenters legitimately.
  const { hasBearer } = await import("@/lib/security");
  if (!hasBearer(req)) {
    const { clientIp } = await import("@/lib/security");
    if (await isVpn(clientIp(req))) {
      const { readDb, writeDb, uid } = await import("@/lib/db");
      const { recordViolation } = await import("@/lib/security");
      recordViolation(clientIp(req), 1); // soft signal only — VPN flags have false positives
      try {
        const db = await readDb();
        db.events.push({ id: uid("e"), userId: p.sub, action: "vpn_block", detail: "task from VPN/proxy", at: new Date().toISOString() });
        await writeDb(db);
      } catch { /* best effort */ }
      return NextResponse.json({ error: "VPN/Proxy detected. Disable it to send requests. No VPN on? Wait ~10 min and retry." }, { status: 403 });
    }
  }
  const out = await createTaskAndDispatch(p.sub, String(title || ""), String(prompt || ""), {
    kind: kind === "fix-compile" ? "fix-compile" : "compile",
    files: Array.isArray(files) ? files : [],
  });
  if ("error" in out) return NextResponse.json({ error: out.error }, { status: out.status });
  return NextResponse.json({ ok: true, task: out.task }, { status: 201 });
}
