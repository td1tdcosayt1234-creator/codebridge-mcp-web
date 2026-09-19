import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { getClient, issueCode, newPersonalKey, saveClient } from "@/lib/mcpOAuth";
import { readDb, writeDb, uid } from "@/lib/db";
import { webOrigin } from "@/lib/mcpAuth";

export const dynamic = "force-dynamic";

const CSS =
  "*{box-sizing:border-box}" +
  "body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;" +
  "background:radial-gradient(1200px 600px at 20% -10%,#1b2a6b 0%,transparent 60%)," +
  "radial-gradient(1000px 500px at 110% 110%,#0e5a6b 0%,transparent 55%),#070b16;" +
  "color:#eaf0ff;font-family:system-ui,Segoe UI,Roboto,Inter,Arial,sans-serif}" +
  ".card{width:100%;max-width:480px;background:rgba(14,21,43,.92);border:1px solid #22d3ee33;border-radius:20px;" +
  "padding:32px 30px;box-shadow:0 0 80px -20px #22d3ee66,0 24px 60px -30px #000;text-align:center;backdrop-filter:blur(8px)}" +
  ".mark{width:52px;height:52px;margin:0 auto 14px;border-radius:16px;display:flex;align-items:center;justify-content:center;" +
  "font-size:26px;background:linear-gradient(135deg,#6c8cff,#22d3ee);box-shadow:0 8px 30px -8px #22d3eeaa}" +
  ".eyebrow{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#22d3ee;margin:0 0 6px}" +
  "h1{margin:0 0 8px;font-size:25px;line-height:1.25}" +
  ".muted{color:#93a3c4;font-size:14px;line-height:1.65;margin:8px 0}" +
  ".agent{display:flex;align-items:center;gap:12px;background:#ffffff08;border:1px solid #ffffff14;border-radius:14px;padding:12px 14px;margin:18px 0;text-align:left}" +
  ".avatar{width:38px;height:38px;border-radius:11px;flex:none;display:flex;align-items:center;justify-content:center;" +
  "font-weight:800;background:linear-gradient(135deg,#6c8cff55,#22d3ee55);border:1px solid #ffffff22}" +
  ".agent b{display:block;font-size:14px}.agent span{display:block;font-size:12px;color:#93a3c4}" +
  ".perms{background:#22c55e0d;border:1px solid #22c55e2e;border-radius:14px;padding:6px 16px;margin:0 0 6px;text-align:left;font-size:13.5px}" +
  ".perms div{padding:7px 0;border-bottom:1px dashed #ffffff10}.perms div:last-child{border-bottom:0}" +
  ".no{color:#f87171}.yes{color:#4ade80}" +
  ".row{display:flex;gap:10px;margin-top:20px}" +
  ".btn{flex:1;padding:13px 16px;border-radius:13px;border:0;cursor:pointer;font-weight:800;font-size:15px;text-decoration:none;display:inline-block}" +
  ".go{background:linear-gradient(90deg,#6c8cff,#22d3ee);color:#04122b;box-shadow:0 10px 28px -10px #22d3eecc}" +
  ".go:hover{filter:brightness(1.08)}.stop{background:transparent;border:1px solid #ffffff2e;color:#eaf0ff}" +
  ".foot{margin-top:18px;font-size:12px;color:#5f6f92}" +
  ".spin{width:46px;height:46px;margin:6px auto 14px;border-radius:50%;border:4px solid #22d3ee33;border-top-color:#22d3ee;animation:sp 0.9s linear infinite}" +
  "@keyframes sp{to{transform:rotate(360deg)}}" +
  ".okmark{width:52px;height:52px;margin:0 auto 14px;border-radius:50%;display:flex;align-items:center;justify-content:center;" +
  "font-size:26px;background:#22c55e22;border:2px solid #4ade80;color:#4ade80}" +
  ".warnbox{background:#f59e0b12;border:1px solid #f59e0b44;border-radius:14px;padding:14px 16px;margin-top:16px;text-align:left;font-size:13.5px}" +
  ".warnbox ol{margin:8px 0 4px;padding-left:20px;color:#cbd5f5}.warnbox li{margin:5px 0}" +
  "code{font-family:ui-monospace,Consolas,monospace;font-size:12px;background:#00000055;padding:2px 7px;border-radius:7px;color:#a5f3fc}" +
  "a.link{color:#22d3ee}";

function page(title: string, inner: string): Response {
  const html =
    '<!doctype html><html lang="en"><head><meta charset="utf-8"/>' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"/>' +
    "<title>" + title + " — CodeBridge</title><style>" + CSS + "</style></head><body>" +
    '<div class="card"><div class="mark">◈</div>' + inner + "</div></body></html>";
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function params(url: string) {
  const u = new URL(url);
  return {
    clientId: u.searchParams.get("client_id") || "",
    redirectUri: u.searchParams.get("redirect_uri") || "",
    state: u.searchParams.get("state") || "",
    challenge: u.searchParams.get("code_challenge") || "",
    method: u.searchParams.get("code_challenge_method") || "S256",
    qs: u.searchParams.toString(),
  };
}

function shortId(id: string): string {
  return id.length > 18 ? id.slice(0, 10) + "…" + id.slice(-4) : id;
}

function callbackHost(uri: string): string {
  try {
    return new URL(uri).host;
  } catch {
    return uri;
  }
}

// Same loopback over the other hostname form. Windows browsers often resolve
// `localhost` to ::1 while the agent listens on 127.0.0.1 (or vice versa) —
// trying both forms turns a dead redirect into a working one.
function altCallback(uri: string): string | null {
  try {
    const u = new URL(uri);
    if (u.hostname === "localhost") {
      u.hostname = "127.0.0.1";
      return u.toString();
    }
    if (u.hostname === "127.0.0.1") {
      u.hostname = "localhost";
      return u.toString();
    }
  } catch {
    /* keep null */
  }
  return null;
}

// Notion-style one-click connect: the agent opens this in a browser, the user
// logs in (if needed) and clicks Connect — the agent gets its token.
export async function GET(req: Request) {
  const p = params(req.url);
  if (!p.clientId || !p.redirectUri)
    return page(
      "Connect",
      '<p class="eyebrow">CodeBridge MCP</p><h1>Connect your agent</h1>' +
        '<p class="muted">Open this page from your AI client (opencode / Cursor / Claude) so it can pass its connection details. Or connect manually: add <code>/api/mcp</code> as a remote MCP server.</p>' +
        '<p class="foot">No client details found in this URL.</p>'
    );
  // Lenient DCR: register unknown clients on the fly (localhost-friendly).
  if (!(await getClient(p.clientId))) await saveClient(p.clientId, [p.redirectUri]);
  const t = cookies().get("session")?.value || "";
  const me = await verifyJwt(t);
  if (!me) {
    return NextResponse.redirect(
      webOrigin(req) + "/login?next=" + encodeURIComponent("/api/oauth/authorize?" + p.qs)
    );
  }
  const email = esc(String(me.email || me.sub || "your account"));
  return page(
    "Connect agent",
    '<p class="eyebrow">CodeBridge MCP</p><h1>Connect this agent?</h1>' +
      '<p class="muted">Your AI coding agent wants to work as <b>' + email + "</b>.</p>" +
      '<div class="agent"><div class="avatar">🤖</div><div><b>AI coding agent</b><span>' +
      esc(shortId(p.clientId)) + " • " + esc(callbackHost(p.redirectUri)) + "</span></div></div>" +
      '<div class="perms"><div><span class="yes">✓</span> Compile code in the cloud</div>' +
      '<div><span class="yes">✓</span> Spend coins from your balance</div>' +
      '<div><span class="no">✕</span> Never sees your password</div></div>' +
      '<form method="POST" action="/api/oauth/authorize?' + p.qs.replace(/&/g, "&amp;") + '">' +
      '<div class="row"><button class="btn go" name="allow" value="yes" type="submit">Connect</button>' +
      '<button class="btn stop" name="allow" value="no" type="submit">Cancel</button></div></form>' +
      '<p class="foot">One click • codes expire in 10 min • revoke anytime in /dashboard/mcp</p>'
  );
}

export async function POST(req: Request) {
  const { csrfCheck, csrfBlock } = await import("@/lib/security");
  if (!csrfCheck(req)) return csrfBlock();
  const p = params(req.url);
  const t = cookies().get("session")?.value || "";
  const me = await verifyJwt(t);
  if (!me)
    return NextResponse.redirect(
      webOrigin(req) + "/login?next=" + encodeURIComponent("/api/oauth/authorize?" + p.qs)
    );
  const form = await req.formData().catch(() => null);
  const allow = String(form?.get("allow") || "");
  const sep = p.redirectUri.includes("?") ? "&" : "?";
  const errBack =
    p.redirectUri + sep + "error=access_denied" + (p.state ? "&state=" + encodeURIComponent(p.state) : "");
  if (allow !== "yes") return NextResponse.redirect(errBack);
  if (!(await getClient(p.clientId))) await saveClient(p.clientId, [p.redirectUri]);
  const code = await issueCode(String(me.sub), p.clientId, p.redirectUri, p.challenge, p.method);
  const back =
    p.redirectUri + sep + "code=" + encodeURIComponent(code) + (p.state ? "&state=" + encodeURIComponent(p.state) : "");
  const alt = altCallback(back);

  // Guaranteed fallback: the user's personal key. If the agent's local
  // callback is unreachable, pasting this key into the agent config headers
  // connects it without any redirect at all.
  const db = await readDb();
  let rec = db.mcpKeys.find((k) => k.userId === String(me.sub));
  if (!rec) {
    rec = { userId: String(me.sub), key: newPersonalKey() };
    db.mcpKeys.push(rec);
    db.events.push({
      id: uid("e"),
      userId: String(me.sub),
      action: "mcp_key_oauth",
      detail: "personal MCP key issued via OAuth",
      at: new Date().toISOString(),
    });
    await writeDb(db);
  }
  const myKey = esc(rec.key);

  // Smart handoff: probe the agent's callback (both localhost/127.0.0.1
  // forms) and jump to the form that answers. Only if nothing answers do we
  // settle into a waiting panel that keeps retrying and offers the key
  // fallback — so a momentarily-busy agent still connects by itself.
  const jsBack = JSON.stringify(back);
  const jsAlt = JSON.stringify(alt);
  return page(
    "Connecting",
    '<p class="eyebrow">CodeBridge MCP</p>' +
      '<div id="spin"><div class="spin"></div><h1>Connecting your agent…</h1>' +
      '<p class="muted">Handing the login to your agent. Keep it running.</p></div>' +
      '<div id="done" hidden><div class="okmark">✓</div><h1>Connected!</h1>' +
      '<p class="muted">Your agent picked up the login. You can close this tab and ask it to compile.</p></div>' +
      '<div id="wait" hidden><div class="spin"></div><h1>Still connecting…</h1>' +
      '<p class="muted">Your agent is taking a moment. This page keeps trying by itself — <b>keep the agent open</b>.</p>' +
      '<div class="warnbox"><b>Guaranteed path (no waiting):</b> paste your personal key into the agent config ' +
      "headers and restart it — it connects immediately, no browser round-trip needed:" +
      '<pre style="white-space:pre-wrap;word-break:break-all;margin:10px 0 4px">\"headers\": { \"Authorization\": \"Bearer ' + myKey + '\" }</pre>' +
      '<div class="row"><button class="btn go" type="button" onclick="copyKey()">Copy my key</button>' +
      '<a class="btn stop" id="retry" href="' + esc(back) + '">Try redirect now</a></div>' +
      '<p class="muted" id="copymsg" style="margin:8px 0 0"></p>' +
      "<p class=\"muted\">If the agent was restarted, remove + re-add the CodeBridge MCP server there so it opens a fresh login, then Connect within a minute.</p></div>" +
      '<p class="foot">Talking to: <code>' + esc(callbackHost(p.redirectUri)) + "</code></p></div>" +
      "<script>" +
      "var cb=" + jsBack + ";var alt=" + jsAlt + ";var key=" + JSON.stringify(rec.key) + ";" +
      "function show(id){document.getElementById('spin').hidden=true;document.getElementById('done').hidden=true;document.getElementById('wait').hidden=true;document.getElementById(id).hidden=false;}" +
      "function copyKey(){var m=document.getElementById('copymsg');if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(key).then(function(){m.textContent='Copied! Paste it into headers and restart your agent.';},function(){m.textContent=key;});}else{m.textContent=key;}}" +
      "var done=false,tries=0;" +
      "function go(url){if(done)return;done=true;show('done');setTimeout(function(){window.location.href=url;},900);}" +
      "function probe(url){return fetch(url,{method:'GET',mode:'no-cors',redirect:'follow',cache:'no-store'});}" +
      "function attempt(){tries++;" +
      "probe(cb).then(function(){go(cb);}).catch(function(){" +
      "if(alt){probe(alt).then(function(){go(alt);}).catch(function(){later();});}else{later();}});}" +
      "function later(){if(done)return;if(tries>=30){show('wait');return;}show('wait');setTimeout(function(){if(!done)attempt();},4000);}" +
      "var first=setTimeout(function(){if(!done){tries=0;attempt();}},600);" +
      "probe(cb).then(function(){clearTimeout(first);go(cb);}).catch(function(){" +
      "if(alt){probe(alt).then(function(){clearTimeout(first);go(alt);}).catch(function(){clearTimeout(first);attempt();});}" +
      "else{clearTimeout(first);attempt();}});" +
      "setTimeout(function(){if(!done)show('wait');},25000);" +
      "</script>" +
      '<noscript><div class="row"><a class="btn go" href="' + esc(back) + '">Continue to your agent</a></div></noscript>'
  );
}
