"use client"; import { useEffect, useState } from "react";
export default function Overview(){
  const [d,setD]=useState<any>(null);
  useEffect(()=>{fetch("/api/overview").then(r=>r.json()).then(setD);},[]);
  if(!d) return <p className="muted">Loading... login required. <a href="/login">Login</a></p>;
  if((d as any).error) return <p>Auth needed. <a href="/login">Login</a></p>;
  return (<div className="grid g3">
    <div className="card"><div className="muted small">Token balance</div><div style={{fontSize:28,fontWeight:800}}>{d.usage?.balance??0}</div><div><a href="/dashboard/earn" className="btn-ghost" style={{padding:"6px 10px",fontSize:12}}>Earn free</a></div></div>
    <div className="card"><div className="muted small">Total used</div><div style={{fontSize:28,fontWeight:800}}>{d.usage?.usedTotal??0}</div><div className="muted small">MCP calls: {d.usage?.mcpCalls??0}</div></div>
    <div className="card"><div className="muted small">Compile requests</div><div style={{fontSize:28,fontWeight:800}}>{d.tasks?.length??0}</div><div><a href="/dashboard/tasks" className="btn-ghost" style={{padding:"6px 10px",fontSize:12}}>New request</a></div></div>
    <div className="card" style={{gridColumn:"1/-1"}}><h3>Recent requests</h3>{(d.tasks||[]).slice(0,5).map((t:any)=>(<div key={t.id} className="small"><span className="badge">{t.status}</span> {t.title} — {t.updatedAt}</div>))}</div>
  </div>);
}
