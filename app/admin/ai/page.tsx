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
  </div>);
}
