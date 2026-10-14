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
  const html = "<!doctype html><html><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/><title>Roun — approve agent</title>"
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
  const { clientIp: cip } = await import("@/lib/security");
  const viewerIp = cip(req);
  const creatorIp = p.fp?.ip || "unknown";
  const netWarn = viewerIp && creatorIp && viewerIp !== creatorIp && viewerIp !== "local" && creatorIp !== "local"
    ? "<div style=\"text-align:left;margin-top:12px;font-size:12.5px;background:#f59e0b18;border:1px solid #f59e0b55;padding:10px 12px;border-radius:10px\">⚠️ This request came from a <b>different network</b> (" + esc(creatorIp) + ") than this browser (" + esc(viewerIp) + "). Only Approve if you recognise it — it may be another device or someone else's agent.</div>"
    : "";
  return shell(
    brand() +
    "<div class=\"icon\">" + ICON_SHIELD + "</div>" +
    "<h1>Allow this agent?</h1>" +
    "<p class=\"muted\">Your coding agent wants to run as <b>" + esc(email) + "</b>. Approving spends <b>your coins</b> when the task runs.</p>" +
    "<div class=\"pill\">" + esc(p.tool) + "</div>" +
    "<div style=\"text-align:left;margin-top:12px;font-size:12px;word-break:break-all;background:#00000044;padding:10px;border-radius:10px\">" + argsPreview + "</div>" +
    "<div style=\"margin-top:8px;font-size:11.5px;color:#66749a\">Request from " + esc(creatorIp) + " • " + esc((p.fp?.ua || "unknown agent").slice(0, 60)) + "</div>" +
    netWarn +
    "<div class=\"user\">" + avatar(email) + "</div>" +
    "<form method=\"POST\" action=\"/api/mcp/approve\" id=\"apvForm\"><input type=\"hidden\" name=\"req\" value=\"" + esc(p.id) + "\"/>" +
    "<input type=\"hidden\" name=\"adblock\" id=\"adblock\" value=\"1\"/>" +
    "<input type=\"hidden\" name=\"human\" id=\"human\" value=\"0\"/>" +
    "<label class=\"remember\"><input type=\"checkbox\" name=\"always\" value=\"yes\" checked/><span>Always allow this agent<small>Approve once — never ask again on this device.</small></span></label>" +
    "<div class=\"row\"><button class=\"btn yes\" id=\"apvYes\" name=\"allow\" value=\"yes\" type=\"submit\" disabled>Approve</button>" +
    "<button class=\"btn no\" id=\"apvNo\" name=\"allow\" value=\"no\" type=\"submit\" disabled>Deny</button></div></form>" +
    "<p class=\"foot\" id=\"adblockWarn\" style=\"color:#f87171\">Checking adblock… (Approve needs it OFF)</p>" +
    "<script>(function(){function probe(){try{var d=document.createElement('div');d.className='adsbox ad-banner sponsored';d.style.cssText='height:1px;width:1px;position:absolute;left:-9999px;';document.body.appendChild(d);var b=d.offsetHeight===0;d.remove();return b;}catch(e){return false;}}" +
    "function apply(){var b=probe();var f=document.getElementById('adblock');if(f)f.value=b?'1':'0';var y=document.getElementById('apvYes'),n=document.getElementById('apvNo'),w=document.getElementById('adblockWarn');if(!b){if(y)y.disabled=false;if(n)n.disabled=false;if(w)w.style.display='none';}else{if(w)w.textContent='Adblock detected — turn it off + reload to Approve. Deny still works.';if(n)n.disabled=false;}return b;}" +
    "apply();setTimeout(apply,2500);" +
    "var fm=document.getElementById('apvForm');if(fm)fm.addEventListener('submit',function(){apply();});" +
    "var y2=document.getElementById('apvYes');if(y2)y2.addEventListener('click',function(e){e.preventDefault();openCap();});" +
    "})();</script>" +
    "<p class=\"foot\">Safe to close this tab after deciding.</p>" +
    "<div id=\"capOverlay\" style=\"display:none;position:fixed;inset:0;z-index:999;background:rgba(3,5,12,.92);align-items:center;justify-content:center;padding:20px\">" +
    "<div style=\"width:100%;max-width:440px;background:#0b0e19;border:1px solid #22d3ee55;border-radius:20px;padding:26px 24px;text-align:center\">" +
    "<div style=\"font-size:11px;letter-spacing:.25em;color:#93a1c0;font-weight:700\">HUMAN CHECK</div>" +
    "<h2 style=\"margin:10px 0 6px;font-size:21px;color:#fff\">Approve er age verify</h2>" +
    "<p class=\"muted\" style=\"font-size:13px\">1) Sponsor kholo &nbsp;2) box e tik daw &nbsp;3) OK chap daw</p>" +
    "<a id=\"capAd\" href=\"https://uplcm.com/4/12029550\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"display:block;margin:14px 0;border-radius:14px;overflow:hidden;text-decoration:none;background:linear-gradient(135deg,#1e1b4b,#0e7490);border:1px solid #22d3ee55\">" +
    "<div style=\"padding:26px 18px\"><div style=\"font-size:44px\">🎁</div>" +
    "<div style=\"color:#fff;font-weight:800;font-size:17px;margin-top:6px\">Sponsored — tap to open</div>" +
    "<div style=\"color:#cbd5e1;font-size:12.5px;margin-top:4px\">New tab e big ad khulbe — khola rakhlei count hobe</div>" +
    "<div id=\"capAdState\" style=\"display:inline-block;margin-top:10px;background:#fff;color:#0e7490;font-weight:800;border-radius:8px;padding:8px 16px;font-size:14px\">Open sponsor</div></div></a>" +
    "<label style=\"display:flex;gap:10px;align-items:center;justify-content:center;margin:6px 0 4px;font-size:14px;color:#eef2ff;cursor:pointer\"><input type=\"checkbox\" id=\"capBox\" style=\"width:20px;height:20px;accent-color:#22d3ee\"/> Ami robot noi</label>" +
    "<p id=\"capTimer\" class=\"muted\" style=\"font-size:12.5px;margin:8px 0 0\">Ad khule 6s wait koro…</p>" +
    "<button id=\"capOk\" class=\"btn yes\" type=\"button\" disabled style=\"width:100%;margin-top:12px;opacity:.45\">OK — Confirm Approve</button>" +
    "<button id=\"capCancel\" class=\"btn no\" type=\"button\" style=\"width:100%;margin-top:8px\">Back</button>" +
    "</div></div>" +
    "<script>(function(){var opened=false,left=0,timer=null;" +
    "function upd(){var ok=document.getElementById('capOk'),tm=document.getElementById('capTimer'),box=document.getElementById('capBox');var ready=opened&&box&&box.checked&&left<=0;if(ok){ok.disabled=!ready;ok.style.opacity=ready?'1':'.45';}if(tm)tm.textContent=!opened?'Sponsor kholo (uporer banner e tap koro)':(left>0?('Wait '+left+'s…'):(box&&box.checked?'Ready — OK chap daw':'Box e tik daw (Ami robot noi)'));}" +
    "window.openCap=function(){var o=document.getElementById('capOverlay');if(o)o.style.display='flex';left=6;if(timer)clearInterval(timer);timer=setInterval(function(){left--;if(left<=0){clearInterval(timer);}upd();},1000);upd();};" +
    "var ad=document.getElementById('capAd');if(ad)ad.addEventListener('click',function(){opened=true;var st=document.getElementById('capAdState');if(st)st.textContent='Opened ✓';upd();});" +
    "var bx=document.getElementById('capBox');if(bx)bx.addEventListener('change',upd);" +
    "var c=document.getElementById('capCancel');if(c)c.addEventListener('click',function(){var o=document.getElementById('capOverlay');if(o)o.style.display='none';if(timer)clearInterval(timer);});" +
    "var okb=document.getElementById('capOk');if(okb)okb.addEventListener('click',function(){var hf=document.getElementById('human');if(hf)hf.value='1';var fm=document.getElementById('apvForm');if(fm)fm.submit();});" +
    "})();</script>"
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
  const adblock = String(form?.get("adblock") || "");
  // Strict: adblock on = no Approve (Deny always works — it spends nothing).
  if (allow === "yes" && adblock === "1")
    return shell(brand() + "<div class=\"icon\">" + ICON_DENY + "</div><h1>Adblock detected</h1><p class=\"muted\">Turn adblock <b>OFF</b> for this site + reload, then Approve. Deny still works.</p>");
  // Human check: Approve must come through the captcha + big-ad overlay.
  // Direct-form bypass attempt = heavy violation (fast track to suspend ladder).
  if (allow === "yes" && String(form?.get("human") || "") !== "1") {
    const { recordViolation } = await import("@/lib/security");
    recordViolation(clientIp(req), 10);
    return shell(brand() + "<div class=\"icon\">" + ICON_DENY + "</div><h1>Verify first</h1><p class=\"muted\">Tap <b>Approve</b>, finish the human check (open sponsor + tick the box + OK). Deny still works.</p>");
  }
  // VPN/proxy/datacenter exit = no Approve (spends your coins; exit-IP abuse vector).
  if (allow === "yes") {
    const { isVpn } = await import("@/lib/antifraud");
    if (await isVpn(clientIp(req)))
      return shell(brand() + "<div class=\"icon\">" + ICON_DENY + "</div><h1>VPN detected</h1><p class=\"muted\">Turn VPN/Proxy <b>OFF</b> + reload, then Approve. No VPN on? Wait ~10 min and retry. Deny still works.</p>");
  }
  const me = await verifyJwt(t);
  if (!me) {
    // Keep the request id across login so the user lands back on THIS approval.
    const back = "/api/mcp/approve" + (id ? "?req=" + encodeURIComponent(id) : "");
    return NextResponse.redirect(webOrigin(req) + "/login?next=" + encodeURIComponent(back));
  }
  const done = await settlePending(id, allow === "yes" ? String(me.sub) : null, clientIp(req));
  if (!done) return shell(brand() + "<div class=\"icon\">" + ICON_CLOCK + "</div><h1>Link expired</h1><p class=\"muted\">Already decided or too old. Ask your agent for a fresh link.</p>");
  // Audit cross-network approvals: creator IP vs approver IP mismatch can mean
  // a hijacked approval URL. Logged, still honoured (cross-device is legit).
  try {
    const { readDb, writeDb, uid } = await import("@/lib/db");
    if (done.fp?.ip && clientIp(req) !== done.fp.ip) {
      const db = await readDb();
      db.events.push({ id: uid("e"), userId: String(me.sub), action: "mcp_approve_cross_net", detail: id + " creator=" + done.fp.ip + " approver=" + clientIp(req), at: new Date().toISOString() });
      await writeDb(db);
    }
  } catch { /* best effort */ }
  if (allow === "yes") {
    if (always) {
      const { addTrusted } = await import("@/lib/mcpAuth");
      await addTrusted(String(me.sub), done.fp, done.tool);
    }
    return shell(brand() + "<div class=\"icon\">" + ICON_CHECK + "</div><h1>Approved</h1><p class=\"muted\">" + (always ? "This agent is remembered — no approval needed next time. " : "") + "Return to your agent — it will pick up the result automatically. You can close this tab.</p>");
  }
  return shell(brand() + "<div class=\"icon\">" + ICON_DENY + "</div><h1>Denied</h1><p class=\"muted\">Your agent was told. You can close this tab.</p>");
}
