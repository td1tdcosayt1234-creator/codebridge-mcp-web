"use client";
import { useEffect, useState } from "react";
export default function McpPage(){
  const [key,setKey]=useState<string|null>(null); const [msg,setMsg]=useState(""); const [origin,setOrigin]=useState("");
  useEffect(()=>{ setOrigin(window.location.origin); fetch("/api/overview").then(r=>r.json()).then(d=>{ if(d.key) setKey(d.key); }); },[]);
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
  return (<div><h2>Connect your agent — login required</h2>
    <div className="card" style={{borderColor:"#22c55e55"}}><b>✨ Easiest: automatic browser login (no key pasting).</b><p className="muted small" style={{marginBottom:0}}>Add the MCP with only the URL (no headers). When the agent calls a tool, it gets a browser link — open it here, login (you already are) + Approve, and the agent continues by itself with <code>auth_check</code>. Use the personal key below only for headless/CI agents.</p></div>
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
