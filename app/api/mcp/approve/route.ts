import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { getPending, settlePending, webOrigin } from "@/lib/mcpAuth";

function shell(inner: string): Response {
  const html = "<!doctype html><html><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/><title>CodeBridge — approve agent</title>"
    + "<style>body{margin:0;background:#070b16;color:#eaf0ff;font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:20px}"
    + ".card{max-width:460px;width:100%;background:#0e152b;border:1px solid #22d3ee44;border-radius:16px;padding:28px;text-align:center;box-shadow:0 0 60px -18px #22d3ee88}"
    + "h1{margin:0 0 8px;font-size:24px}.muted{color:#8b9bb8;font-size:14px;line-height:1.6}"
    + ".row{display:flex;gap:10px;margin-top:18px}.btn{flex:1;padding:12px;border-radius:12px;border:0;cursor:pointer;font-weight:700;font-size:15px}"
    + ".yes{background:linear-gradient(90deg,#6c8cff,#22d3ee);color:#04122b}.no{background:transparent;border:1px solid #ffffff2e;color:#eaf0ff}</style></head>"
    + "<body><div class=\"card\">" + inner + "</div></body></html>";
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// Browser step of the agent login flow: login (or signup) here, then Approve
// lets the waiting agent call run as you. Safe to close after deciding.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("req") || "";
  const p = await getPending(id);
  if (!p) return shell("<h1>Link expired</h1><p class=\"muted\">This approval request is unknown or older than 10 minutes. Ask your agent to call the tool again for a fresh link.</p>");
  const t = cookies().get("session")?.value || "";
  const me = await verifyJwt(t);
  if (!me) {
    const back = "/api/mcp/approve?req=" + encodeURIComponent(id);
    return NextResponse.redirect(webOrigin(req) + "/login?next=" + encodeURIComponent(back));
  }
  return shell(
    "<h1>Allow this agent?</h1>" +
    "<p class=\"muted\">Your coding agent wants to run <b>" + p.tool + "</b> as <b>" + (me.email || me.sub) + "</b>. Approving spends YOUR coins when the task runs.</p>" +
    "<form method=\"POST\" action=\"/api/mcp/approve\"><input type=\"hidden\" name=\"req\" value=\"" + p.id + "\"/>" +
    "<div class=\"row\"><button class=\"yes\" name=\"allow\" value=\"yes\" type=\"submit\">Approve</button>" +
    "<button class=\"no\" name=\"allow\" value=\"no\" type=\"submit\">Deny</button></div></form>"
  );
}

export async function POST(req: Request) {
  const { csrfCheck, csrfBlock } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const t = cookies().get("session")?.value || "";
  const me = await verifyJwt(t);
  if (!me) {
    const back = "/api/mcp/approve";
    return NextResponse.redirect(webOrigin(req) + "/login?next=" + encodeURIComponent(back));
  }
  const form = await req.formData().catch(() => null);
  const id = String(form?.get("req") || "");
  const allow = String(form?.get("allow") || "");
  const done = await settlePending(id, allow === "yes" ? String(me.sub) : null);
  if (!done) return shell("<h1>Link expired</h1><p class=\"muted\">Already decided or too old. Ask your agent for a fresh link.</p>");
  if (allow === "yes") return shell("<h1>Approved ✓</h1><p class=\"muted\">Return to your agent — it will pick up the result automatically. You can close this tab.</p>");
  return shell("<h1>Denied</h1><p class=\"muted\">Your agent was told. You can close this tab.</p>");
}
