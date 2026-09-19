"use client";
import { useEffect, useState } from "react";
export default function McpPage(){
  const [key,setKey]=useState<string|null>(null); const [msg,setMsg]=useState(""); const [origin,setOrigin]=useState("");
  const [trusted,setTrusted]=useState<any[]>([]);
  useEffect(()=>{ setOrigin(window.location.origin); fetch("/api/overview").then(r=>r.json()).then(d=>{ if(d.key) setKey(d.key); }); loadTrusted(); },[]);
  async function loadTrusted(){ const r=await fetch("/api/mcp/trusted"); const j=await r.json(); if(r.ok) setTrusted(j.trusted||[]); }
  async function revoke(id:string){ if(!confirm("Forget this agent? It will need browser approval again.")) return; const r=await fetch("/api/mcp/trusted",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})}); if(r.ok) loadTrusted(); }
  async function copy(){ if(!key) return; try{ await navigator.clipboard.writeText(key); setMsg("Copied!"); }catch{ setMsg(key); } }
  async function regen(){
    if(!confirm("Generate a new personal key? Agents using the old key stop working.")) return;
    setMsg("Generating...");
    const r=await fetch("/api/mcp/key",{method:"POST"});
    const j=await r.json();
    if(r.ok){ setKey(j.key); setMsg("New key active — update your agent config."); }
    else setMsg("Error: "+(j.error||"failed"));
  }
  const snippet = `{\n  "mcp": {\n    "codebridge": {\n      "type": "remote",\n      "url": "${origin || "https://your-domain.com"}/api/mcp",\n      "headers": { "Authorization": "Bearer ${key || "PASTE_YOUR_KEY_HERE"}" }\n    }\n  }\n}`;
  return (<div><h2>Connect your agent — one click</h2>
    <div className="card" style={{borderColor:"#22c55e55"}}><b>✨ Easiest (Notion-style): just the URL, no key.</b><p className="muted small" style={{marginBottom:0}}>Add <code>{(origin || "https://your-domain.com") + "/api/mcp"}</code> as a remote MCP server — the client opens a browser login, you click <b>Connect</b>, done. Wrong/old key? Clients now get a clear <code>invalid_token</code> error instead of a confusing message.</p></div>
    <div className="card" style={{borderColor:"#22c55e55"}}><b>✨ Easiest: automatic browser login (approve once).</b><p className="muted small" style={{marginBottom:0}}>Add the MCP with only the URL (no headers). On first use the agent gives you a browser link — open it, login + tick <b>Always allow</b> + Approve. After that one approval this agent runs without asking again. Revoke anytime below.</p></div>
    <div className="card" style={{marginTop:12}}><h3>Remembered agents</h3>
      {trusted.length===0&&<p className="muted small">None yet — approve an agent once with “Always allow” and it appears here.</p>}
      {trusted.map((a:any)=>(<div key={a.id} className="small" style={{borderBottom:"1px solid #ffffff12",padding:"6px 0",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}><span><b>{a.tool}</b> <span className="muted">• {a.ip} • {a.ua ? a.ua.slice(0,40) : "no UA"} • last {a.lastUsed}</span></span><button className="btn-ghost" style={{width:"auto",padding:"6px 10px"}} onClick={()=>revoke(a.id)}>Forget</button></div>))}
    </div>
    <div className="card" style={{marginTop:12}}><p className="muted small">Steps: <b>1.</b> signup/login on this website (you are logged in now) <b>2.</b> paste your personal key below into the agent config <b>3.</b> restart the agent app. Without a valid key every tool call is rejected.</p>
      <label>Your personal MCP key (never share it)</label>
      <div style={{display:"flex",gap:8}}>
        <input readOnly value={key||"loading..."} onFocus={e=>e.target.select()} style={{fontFamily:"ui-monospace,Consolas,monospace"}}/>
        <button className="btn-ghost" style={{width:"auto",whiteSpace:"nowrap"}} onClick={copy}>Copy</button>
        <button className="btn-ghost" style={{width:"auto",whiteSpace:"nowrap"}} onClick={regen}>Regenerate</button>
      </div>
      {msg&&<p className="small">{msg}</p>}
    </div>
    <div className="card" style={{marginTop:12}}><p className="muted small">Put this in your project <code>opencode.json</code> (replace URL on deploy):</p><pre>{snippet}</pre>
    <p className="muted small">Then tell the agent: <i>compile my files with codebridge compile</i>. Each call spends your own coins.</p></div>
  </div>);
}
