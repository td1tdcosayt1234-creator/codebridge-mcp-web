"use client"; import { useEffect, useState } from "react";
export default function AdminAI(){
  const [key,setKey]=useState(""); const [baseUrl,setBaseUrl]=useState("https://opencode.ai/zen/v1");
  const [model,setModel]=useState("gpt-5.4-mini"); const [free,setFree]=useState<string[]>([]);
  const [st,setSt]=useState<any>(null); const [msg,setMsg]=useState("");
  async function load(){
    const r=await fetch("/api/admin/ai"); setSt(await r.json());
    const g=await fetch("/api/game/generate").then(x=>x.json()).catch(()=>({}));
    if(Array.isArray(g?.freeModels)) setFree(g.freeModels);
  }
  useEffect(()=>{load();},[]);
  useEffect(()=>{ if(st && !key){ if(st.baseUrl) setBaseUrl(st.baseUrl); if(st.model) setModel(st.model); } },[st]); // eslint-disable-line
  async function save(e:any){
    e.preventDefault(); setMsg("Verifying + saving...");
    const r=await fetch("/api/admin/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key,baseUrl,model})});
    const j=await r.json(); setMsg(r.ok?"AI key saved — Game Studio uses it immediately, no restart.":"Error: "+(j.error||"failed"));
    setKey(""); load();
  }
  async function del(){ if(!confirm("Remove the global AI key? Game Studio falls back to .env key, then free provider.")) return; await fetch("/api/admin/ai",{method:"DELETE"}); load(); }
  // ---- opencode CLI login (free Zen models) ----
  const [oc,setOc]=useState<any>(null); const [ocKey,setOcKey]=useState(""); const [ocMsg,setOcMsg]=useState("");
  async function ocLoad(){ const r=await fetch("/api/admin/opencode"); setOc(await r.json()); }
  useEffect(()=>{ocLoad();},[]);
  async function ocLogin(e:any){
    e.preventDefault(); setOcMsg("Verifying key with opencode.ai...");
    const r=await fetch("/api/admin/opencode",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:ocKey})});
    const j=await r.json(); setOcMsg(r.ok?"opencode CLI logged in - Game Studio uses free models now.":"Error: "+(j.error||"failed"));
    setOcKey(""); ocLoad();
  }
  async function ocLogout(){ if(!confirm("Log out opencode CLI? Game Studio falls back to Kilo free.")) return; await fetch("/api/admin/opencode",{method:"DELETE"}); setOcMsg(""); ocLoad(); }
  if(st?.error) return <p>Admin only. <a href="/login">Login as admin</a></p>;
  return (<div>
    <h2>Global AI Key — Game Studio</h2>
    <p className="muted small">Paste one OpenCode Zen key here (oc_sk_...). Game Studio uses this key first — no .env edit, no restart. Empty = .env key, then free provider. Key is verified live before saving and stored AES-256-GCM encrypted.</p>
    <div className="card">
      <div>Status: <b>{st?.configured?"configured":"not set"}</b>{st?.configured&&<span className="muted small"> — {st.masked}, model {st.model}, by {st.updatedBy} at {st.updatedAt}</span>}</div>
      <div className="muted small" style={{marginTop:4}}>.env key: <b>{st?.envKeySet?"present (fallback)":"absent"}</b></div>
      <form onSubmit={save}>
        <label>Paste new AI key (verified before saving)</label>
        <input value={key} onChange={e=>setKey(e.target.value)} placeholder="oc_sk_..." autoComplete="off" type="password"/>
        <label>Base URL (OpenAI-compatible)</label>
        <input value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} placeholder="https://opencode.ai/zen/v1" autoComplete="off"/>
        <label>Default model</label>
        <input value={model} onChange={e=>setModel(e.target.value)} placeholder="gpt-5.4-mini" autoComplete="off" list="ai-models"/>
        <datalist id="ai-models">{free.map(m=>(<option key={m} value={m}/>))}</datalist>
        <div style={{marginTop:10,display:"flex",gap:8}}>
          <button className="btn">Save AI key</button>
          <button type="button" className="btn-ghost" onClick={del}>Remove</button>
        </div>
      </form>
      {msg&&<p className="small">{msg}</p>}
    </div>
    <h2 style={{marginTop:22}}>opencode CLI - free models</h2>
    <p className="muted small">Game Studio uses the server-side opencode CLI first (free Zen models), Kilo second. One login here unlocks it - no terminal needed. Get a free key at <a href="https://opencode.ai/auth" target="_blank" rel="noreferrer">opencode.ai/auth</a>.</p>
    <div className="card">
      <div>Status: <b>{oc ? (oc.installed ? (oc.loggedIn ? "logged in" : "not logged in") : "CLI not installed") : "loading..."}</b>
        {oc?.version&&<span className="muted small"> - v{oc.version}</span>}
        {oc?.loggedIn&&<span className="muted small"> - default {oc.defaultModel}</span>}</div>
      {oc && !oc.installed && <p className="small">Install on server: <code>npm i -g opencode-ai</code> then reload this page.</p>}
      {oc?.installed && !oc?.loggedIn && (
        <form onSubmit={ocLogin}>
          <label>Paste opencode.ai API key (verified live before saving)</label>
          <input value={ocKey} onChange={e=>setOcKey(e.target.value)} placeholder="oc_sk_... or sk-..." autoComplete="off" type="password"/>
          <div style={{marginTop:10}}><button className="btn">Log in opencode CLI</button></div>
        </form>
      )}
      {oc?.loggedIn && (
        <div style={{marginTop:10,display:"flex",gap:8,alignItems:"center"}}>
          <span className="muted small">Free models: {oc.freeModels?.slice(0,4).join(", ")} +{Math.max(0,(oc.freeModels?.length||0)-4)} more</span>
          <button type="button" className="btn-ghost" onClick={ocLogout}>Log out</button>
        </div>
      )}
      {ocMsg&&<p className="small">{ocMsg}</p>}
    </div>
  </div>);
}
