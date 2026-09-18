"use client"; import { useEffect, useState } from "react";
export default function Builds(){
  const [d,setD]=useState<any>(null); const [repo,setRepo]=useState("demo/repo"); const [branch,setBranch]=useState("main");
  async function load(){ const r=await fetch("/api/overview"); setD(await r.json()); }
  useEffect(()=>{load();},[]);
  async function trig(e:any){ e.preventDefault(); await fetch("/api/overview",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({repo,branch})}); load(); }
  return (<div><h2>Builds</h2><div className="card"><form onSubmit={trig} style={{display:"flex",gap:8}}><input value={repo} onChange={e=>setRepo(e.target.value)}/><input value={branch} onChange={e=>setBranch(e.target.value)}/><button className="btn">Trigger</button></form></div>{(d?.builds||[]).map((b:any)=>(<div key={b.id} className="card" style={{marginTop:8}}><span className="badge">{b.status}</span> <b>{b.repo}</b> #{b.branch}<div className="muted small">{b.at}</div><pre>{b.log}</pre></div>))}</div>);
}
