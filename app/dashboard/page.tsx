"use client"; import { useEffect, useState } from "react";
export default function Overview(){
  const [d,setD]=useState<any>(null);
  useEffect(()=>{fetch("/api/overview").then(r=>r.json()).then(setD);},[]);
  if(!d) return <p className="muted">Loading... login required. <a href="/login">Login</a></p>;
  if((d as any).error) return <p>Auth needed. <a href="/login">Login</a></p>;
  return (<div className="grid g3">
    <div className="card"><div className="muted small">MCP calls</div><div style={{fontSize:28,fontWeight:800}}>{d.usage?.mcpCalls??0}</div></div>
    <div className="card"><div className="muted small">GitHub calls</div><div style={{fontSize:28,fontWeight:800}}>{d.usage?.githubCalls??0}</div></div>
    <div className="card"><div className="muted small">Builds</div><div style={{fontSize:28,fontWeight:800}}>{d.builds?.length??0}</div></div>
    <div className="card" style={{gridColumn:"1/-1"}}><h3>Recent builds</h3>{(d.builds||[]).slice(0,5).map((b:any)=>(<div key={b.id} className="small"><span className="badge">{b.status}</span> {b.repo}#{b.branch} — {b.at}</div>))||<p className="muted small">none</p>}</div>
  </div>);
}
