"use client"; import { useEffect, useState } from "react";
export default function GithubPage(){
  const [token,setToken]=useState(""); const [st,setSt]=useState<any>(null); const [msg,setMsg]=useState("");
  async function load(){ const r=await fetch("/api/github/token"); setSt(await r.json()); }
  useEffect(()=>{load();},[]);
  async function save(e:any){ e.preventDefault(); const r=await fetch("/api/github/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})}); const j=await r.json(); setMsg(r.ok?"Saved + encrypted.":"Error: "+(j.error||"fail")); setToken(""); load(); }
  async function del(){ await fetch("/api/github/token",{method:"DELETE"}); load(); }
  return (<div><h2>GitHub Classic Token</h2><p className="muted small">GitHub → Settings → Developer settings → Personal access tokens (classic) → scopes: repo, workflow.</p><div className="card"><div>Connected: <b>{st?.connected?"yes":"no"}</b></div>{(st?.repos||[]).map((r:string)=>(<div key={r} className="small">• {r}</div>))}<form onSubmit={save}><label>Paste ghp_... token</label><input value={token} onChange={e=>setToken(e.target.value)} placeholder="ghp_..."/><div style={{marginTop:10,display:"flex",gap:8}}><button className="btn">Save</button><button type="button" className="btn-ghost" onClick={del}>Remove</button></div></form>{msg&&<p className="small">{msg}</p>}</div></div>);
}
