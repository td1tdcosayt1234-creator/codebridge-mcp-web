import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { getPending, settlePending, webOrigin } from "@/lib/mcpAuth";

function esc(s: string): string {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const ICON_SHIELD = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#7dd3fc\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3z\"/><path d=\"M9.5 12l2 2 3.5-4\"/></svg>";
const ICON_CHECK = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#34d399\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M8.5 12.5l2.5 2.5 4.5-5.5\"/></svg>";
const ICON_DENY = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#f87171\" stroke-width=\"1.8\" stroke-linecap=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M9 9l6 6M15 9l-6 6\"/></svg>";
const ICON_CLOCK = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#fbbf24\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/></svg>";

function shell(inner: string): Response {
  const html = "<!doctype html><html><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/><title>CodeBridge — approve agent</title>"
    + "<style>:root{--bg:#060a14;--card:rgba(17,25,46,.8);--line:rgba(148,184,255,.16);--txt:#eef2ff;--mut:#93a1c0;--acc1:#6c8cff;--acc2:#22d3ee}"
    + "*{box-sizing:border-box}"
    + "body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;color:var(--txt);font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial,sans-serif;background:radial-gradient(900px 480px at 15% -5%,#1b2a5e66,transparent 60%),radial-gradient(800px 460px at 90% 110%,#0e5f6e55,transparent 60%),var(--bg)}"
    + ".card{width:100%;max-width:440px;background:var(--card);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--line);border-radius:22px;padding:30px 28px 24px;text-align:center;box-shadow:0 24px 70px -24px #000000cc,0 0 70px -30px #22d3ee66}"
    + ".brand{font-size:11px;letter-spacing:.28em;color:var(--mut);font-weight:700}"
    + ".brand b{color:var(--acc2)}"
    + ".icon{width:64px;height:64px;margin:16px auto 4px;border-radius:20px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#6c8cff22,#22d3ee22);border:1px solid var(--line);box-shadow:inset 0 0 24px #22d3ee11}"
    + ".icon svg{width:30px;height:30px}"
    + "h1{margin:10px 0 8px;font-size:23px;letter-spacing:-.01em}"
    + ".muted{color:var(--mut);font-size:14px;line-height:1.65;margin:0}"
    + ".muted b{color:#fff}"
    + ".pill{display:inline-block;margin-top:12px;padding:6px 14px;border-radius:999px;font-size:13px;font-weight:700;background:#6c8cff1c;border:1px solid #6c8cff55;color:#cdd8ff;font-family:ui-monospace,Consolas,monospace}"
    + ".user{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;font-size:13px;color:var(--mut)}"
    + ".avatar{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--acc1),var(--acc2));display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#04122b}"
    + ".remember{display:flex;gap:10px;align-items:flex-start;text-align:left;margin:18px 0 4px;padding:12px 14px;border-radius:14px;background:#22d3ee0f;border:1px solid #22d3ee33;cursor:pointer;font-size:13.5px}"
    + ".remember input{margin-top:3px;accent-color:#22d3ee;width:16px;height:16px;flex:none;cursor:pointer}"
    + ".remember small{display:block;color:var(--mut);font-size:12px;margin-top:2px}"
    + ".row{display:flex;gap:10px;margin-top:16px}"
    + ".btn{flex:1;padding:13px;border-radius:13px;border:0;cursor:pointer;font-weight:800;font-size:15px;font-family:inherit;transition:transform .12s ease,box-shadow .12s ease,background .12s}"
    + ".yes{background:linear-gradient(90deg,var(--acc1),var(--acc2));color:#04122b;box-shadow:0 10px 26px -12px #22d3eecc}"
    + ".yes:hover{transform:translateY(-1px)}"
    + ".yes:active{transform:translateY(0)}"
    + ".no{background:transparent;border:1px solid #ffffff2a;color:var(--txt)}"
    + ".no:hover{background:#ffffff10}"
    + ".foot{margin:16px 0 0;font-size:12px;color:#66749a}</style></head>"
    + "<body><div class=\"card\">" + inner + "</div></body></html>";
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function brand(): string {
  return "<div class=\"brand\">CODEBRIDGE <b>·</b> AGENT APPROVAL</div>";
}

function avatar(email: string): string {
  const ch = esc((email || "?").trim().charAt(0).toUpperCase() || "?");
  return "<span class=\"avatar\">" + ch + "</span><span>" + esc(email) + "</span>";
}

// Browser step of the agent login flow: login (or signup) here, then Approve
// lets the waiting agent call run as you. Safe to close after deciding.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("req") || "";
  const p = await getPending(id);
  if (!p) return shell(brand() + "<div class=\"icon\">" + ICON_CLOCK + "</div><h1>Link expired</h1><p class=\"muted\">This approval request is unknown or older than 10 minutes. Ask your agent to call the tool again for a fresh link.</p>");
  const t = cookies().get("session")?.value || "";
  const me = await verifyJwt(t);
  if (!me) {
    const back = "/api/mcp/approve?req=" + encodeURIComponent(id);
    return NextResponse.redirect(webOrigin(req) + "/login?next=" + encodeURIComponent(back));
  }
  const email = String(me.email || me.sub);
  const argsPreview = esc(JSON.stringify({ title: (p.args as any)?.title, prompt: String((p.args as any)?.prompt || "").slice(0, 300), files: Array.isArray((p.args as any)?.files) ? (p.args as any).files.map((f: any) => f?.path).slice(0, 10) : [] }));
  return shell(
    brand() +
    "<div class=\"icon\">" + ICON_SHIELD + "</div>" +
    "<h1>Allow this agent?</h1>" +
    "<p class=\"muted\">Your coding agent wants to run as <b>" + esc(email) + "</b>. Approving spends <b>your coins</b> when the task runs.</p>" +
    "<div class=\"pill\">" + esc(p.tool) + "</div>" +
    "<div style=\"text-align:left;margin-top:12px;font-size:12px;word-break:break-all;background:#00000044;padding:10px;border-radius:10px\">" + argsPreview + "</div>" +
    "<div class=\"user\">" + avatar(email) + "</div>" +
    "<form method=\"POST\" action=\"/api/mcp/approve\"><input type=\"hidden\" name=\"req\" value=\"" + esc(p.id) + "\"/>" +
    "<label class=\"remember\"><input type=\"checkbox\" name=\"always\" value=\"yes\" checked/><span>Always allow this agent<small>Approve once — never ask again on this device.</small></span></label>" +
    "<div class=\"row\"><button class=\"btn yes\" name=\"allow\" value=\"yes\" type=\"submit\">Approve</button>" +
    "<button class=\"btn no\" name=\"allow\" value=\"no\" type=\"submit\">Deny</button></div></form>" +
    "<p class=\"foot\">Safe to close this tab after deciding.</p>"
  );
}

export async function POST(req: Request) {
  const { csrfCheck, csrfBlock, rateLimit, clientIp } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const rl = rateLimit("approve:" + clientIp(req), 30, 60 * 1000);
  if (!rl.ok) return shell(brand() + "<div class=\"icon\">" + ICON_CLOCK + "</div><h1>Too many requests</h1><p class=\"muted\">Slow down and try again.</p>");
  const t = cookies().get("session")?.value || "";
  const form = await req.formData().catch(() => null);
  const id = String(form?.get("req") || "");
  const allow = String(form?.get("allow") || "");
  const always = String(form?.get("always") || "") === "yes";
  const me = await verifyJwt(t);
  if (!me) {
    // Keep the request id across login so the user lands back on THIS approval.
    const back = "/api/mcp/approve" + (id ? "?req=" + encodeURIComponent(id) : "");
    return NextResponse.redirect(webOrigin(req) + "/login?next=" + encodeURIComponent(back));
  }
  const done = await settlePending(id, allow === "yes" ? String(me.sub) : null);
  if (!done) return shell(brand() + "<div class=\"icon\">" + ICON_CLOCK + "</div><h1>Link expired</h1><p class=\"muted\">Already decided or too old. Ask your agent for a fresh link.</p>");
  if (allow === "yes") {
    if (always) {
      const { addTrusted } = await import("@/lib/mcpAuth");
      await addTrusted(String(me.sub), done.fp, done.tool);
    }
    return shell(brand() + "<div class=\"icon\">" + ICON_CHECK + "</div><h1>Approved</h1><p class=\"muted\">" + (always ? "This agent is remembered — no approval needed next time. " : "") + "Return to your agent — it will pick up the result automatically. You can close this tab.</p>");
  }
  return shell(brand() + "<div class=\"icon\">" + ICON_DENY + "</div><h1>Denied</h1><p class=\"muted\">Your agent was told. You can close this tab.</p>");
}
