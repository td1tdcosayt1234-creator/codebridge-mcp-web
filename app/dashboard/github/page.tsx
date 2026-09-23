"use client"; import { useEffect, useState } from "react";
export default function GithubStatus(){
  const [st,setSt]=useState<any>(null);
  useEffect(()=>{fetch("/api/github/status").then(r=>r.json()).then(setSt);},[]);
  if(!st) return <p className="muted">Loading... <a href="/login">Login</a></p>;
  if(st.error) return <p>Auth needed. <a href="/login">Login</a></p>;
  const uses=st.uses||{};
  return (<div>
    <div className="kicker"><span className="pulse-dot" />Read-only</div>
    <h2 style={{margin:"0 0 4px"}}>GitHub — <span className="grad-anim">status & your uses</span></h2>
    <p className="muted small">You never paste tokens here. The admin sets one global token and the builder repo. This page is read-only.</p>
    <div className="grid g3" style={{margin:"12px 0"}}>
      <div className="card card-glow"><div className="muted small">🔌 Your GitHub calls</div><div style={{fontSize:28,fontWeight:800}}>{uses.githubCalls??0}</div><div className="muted small">via shared token</div></div>
      <div className="card"><div className="muted small">⚙️ Your builds</div><div style={{fontSize:28,fontWeight:800}}>{uses.builds??0}</div><div className="muted small">last: {uses.lastBuild?String(uses.lastBuild).slice(0,10):"—"}</div></div>
      <div className="card"><div className="muted small">🌍 Global token</div><div style={{marginTop:6}}>{st.configured?<span className="badge ok">configured</span>:<span className="badge bad">not set — ask admin</span>}</div></div>
    </div>
    <div className="grid g2">
      <div className="card"><div className="muted small">Builder repo (Actions runner)</div>
        <div style={{marginTop:6}}><b>{st.builderRepo||"not set"}</b> <span className="muted small">{st.builderWorkflow||""}</span></div>
        <div className="muted small" style={{marginTop:6}}>Requests dispatch a workflow here. Output returns to /dashboard/tasks.</div>
      </div>
      <div className="card"><div className="muted small">Shortcut</div><div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}><a href="/dashboard/tasks" className="btn-ghost">Go to Requests</a><a href="/dashboard/builds" className="btn-ghost">Go to Builds</a><a href="/dashboard/tracking" className="btn-ghost">Your tracking</a></div></div>
    </div>
  </div>);
}
